import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { users, userRoles, roles } from '@/db/schema'
import { eq, ilike, and, or, gte, lte, count, desc } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import bcrypt from 'bcryptjs'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    // 权限检查
    const permissionCheck = await requirePermission('user.read')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const offset = (page - 1) * pageSize

    // 构建查询条件
    const conditions = []
    
    if (search) {
      conditions.push(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(users.username, `%${search}%`)
        )
      )
    }

    // 角色筛选需要通过user_roles表处理
    // if (role) {
    //   conditions.push(eq(users.role, role))
    // }

    if (status === 'locked') {
      conditions.push(eq(users.isLocked, true))
    } else if (status === 'active') {
      conditions.push(eq(users.isLocked, false))
    }

    if (startDate && endDate) {
      conditions.push(
        and(
          gte(users.created_at, new Date(startDate)),
          lte(users.created_at, new Date(endDate + 'T23:59:59.999Z'))
        )
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // 获取用户列表（带角色信息）
    const userResults = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        username: users.username,
        avatar: users.avatar,
        isLocked: users.isLocked,
        lockReason: users.lockReason,
        lockedAt: users.lockedAt,
        created_at: users.created_at,
        lastSuccessfulLoginAt: users.lastSuccessfulLoginAt,
        recentSuccessfulLogins: users.recentSuccessfulLogins,
        roleId: userRoles.roleId,
        roleName: roles.displayName
      })
      .from(users)
      .leftJoin(userRoles, and(
        eq(userRoles.userId, users.id),
        eq(userRoles.isActive, true)
      ))
      .leftJoin(roles, eq(roles.id, userRoles.roleId))
      .where(whereClause)
      .orderBy(desc(users.created_at))
      .limit(pageSize)
      .offset(offset)

    // 获取总数
    const totalResult = await db
      .select({ count: count() })
      .from(users)
      .where(whereClause)

    const total = totalResult[0]?.count || 0

    // 处理用户角色信息
    const userMap = new Map()
    userResults.forEach(user => {
      if (!userMap.has(user.id)) {
        userMap.set(user.id, {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          isLocked: user.isLocked,
          lockReason: user.lockReason,
          lockedAt: user.lockedAt,
          created_at: user.created_at,
          lastSuccessfulLoginAt: user.lastSuccessfulLoginAt,
          recentSuccessfulLogins: user.recentSuccessfulLogins,
          roles: []
        })
      }
      
      if (user.roleId && user.roleName) {
        const existingUser = userMap.get(user.id)
        existingUser.roles.push({
          id: user.roleId,
          name: user.roleName
        })
      }
    })

    const usersWithRoles = Array.from(userMap.values())

    // 获取统计数据
    const statsResult = await db
      .select({
        totalUsers: count(),
        lockedUsers: count(users.isLocked)
      })
      .from(users)

    const activeUsersResult = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.isLocked, false),
          gte(users.lastSuccessfulLoginAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // 30天内登录
        )
      )

    const newUsersTodayResult = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          gte(users.created_at, new Date(new Date().setHours(0, 0, 0, 0))),
          lte(users.created_at, new Date(new Date().setHours(23, 59, 59, 999)))
        )
      )

    const stats = {
      totalUsers: statsResult[0]?.totalUsers || 0,
      activeUsers: activeUsersResult[0]?.count || 0,
      lockedUsers: statsResult[0]?.lockedUsers || 0,
      newUsersToday: newUsersTodayResult[0]?.count || 0
    }

    await logger.info({
      module: 'admin',
      action: 'get_users',
      description: `管理员获取用户列表: 第${page}页，每页${pageSize}条`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithRoles,
        total,
        stats
      }
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'get_users_error',
      description: `获取用户列表时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    // 权限检查
    const permissionCheck = await requirePermission('user.create')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const { email, name, username, role, password } = body

    // 验证必填字段
    if (!email || !username || !role) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    // 检查邮箱是否已存在
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    })

    if (existingUser) {
      return NextResponse.json({ error: '邮箱已存在' }, { status: 400 })
    }

    // 检查用户名是否已存在
    const existingUsername = await db.query.users.findFirst({
      where: eq(users.username, username)
    })

    if (existingUsername) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 400 })
    }

    // 创建用户
    const newUser = await db.insert(users).values({
      id: crypto.randomUUID(),
      email,
      name,
      username,
      role,
      password: password ? await bcrypt.hash(password, 12) : null,
      created_at: new Date(),
      updated_at: new Date()
    }).returning()

    await logger.info({
      module: 'admin',
      action: 'create_user',
      description: `管理员创建用户: ${email}`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: newUser[0]
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'create_user_error',
      description: `创建用户时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '创建用户失败' },
      { status: 500 }
    )
  }
}
