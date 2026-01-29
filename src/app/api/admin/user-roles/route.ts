import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { userRoles, roles, users } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

// 获取用户角色列表
export async function GET(request: NextRequest) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('user.read')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: '缺少用户ID参数' }, { status: 400 })
    }

    // 获取用户角色
    const userRolesList = await db
      .select({
        id: userRoles.id,
        userId: userRoles.userId,
        roleId: userRoles.roleId,
        roleName: roles.name,
        roleDisplayName: roles.displayName,
        assignedBy: userRoles.assignedBy,
        assignedAt: userRoles.assignedAt,
        expiresAt: userRoles.expiresAt,
        isActive: userRoles.isActive,
        priority: userRoles.priority,
        reason: userRoles.reason,
        dataScope: userRoles.dataScope
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId))

    await logger.info({
      module: 'admin',
      action: 'get_user_roles',
      description: `获取用户角色列表: ${userId}`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: userRolesList
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'get_user_roles_error',
      description: `获取用户角色列表时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '获取用户角色列表失败' },
      { status: 500 }
    )
  }
}

// 分配用户角色
export async function POST(request: NextRequest) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('user.update')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, roleId, expiresAt, reason, dataScope } = body

    // 验证必填字段
    if (!userId || !roleId) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    // 检查用户是否存在
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 400 })
    }

    // 检查角色是否存在
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, roleId)
    })

    if (!role) {
      return NextResponse.json({ error: '角色不存在' }, { status: 400 })
    }

    // 检查是否已经分配了该角色
    const existingUserRole = await db.query.userRoles.findFirst({
      where: and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, roleId),
        eq(userRoles.isActive, true)
      )
    })

    if (existingUserRole) {
      return NextResponse.json({ error: '用户已拥有该角色' }, { status: 400 })
    }

    // 分配角色
    const newUserRole = await db.insert(userRoles).values({
      id: crypto.randomUUID(),
      userId,
      roleId,
      assignedBy: session.user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      reason,
      dataScope: dataScope ? JSON.parse(JSON.stringify(dataScope)) : null,
      created_at: new Date(),
      updated_at: new Date()
    }).returning()

    await logger.info({
      module: 'admin',
      action: 'assign_user_role',
      description: `分配用户角色: ${userId} -> ${roleId}`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: newUserRole[0]
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'assign_user_role_error',
      description: `分配用户角色时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '分配用户角色失败' },
      { status: 500 }
    )
  }
}

// 移除用户角色
export async function DELETE(request: NextRequest) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('user.delete')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userRoleId = searchParams.get('userRoleId')

    if (!userRoleId) {
      return NextResponse.json({ error: '缺少用户角色ID参数' }, { status: 400 })
    }

    // 更新角色状态为不活跃
    await db
      .update(userRoles)
      .set({
        isActive: false,
        updated_at: new Date()
      })
      .where(eq(userRoles.id, userRoleId))

    await logger.info({
      module: 'admin',
      action: 'remove_user_role',
      description: `移除用户角色: ${userRoleId}`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      message: '用户角色移除成功'
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'remove_user_role_error',
      description: `移除用户角色时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '移除用户角色失败' },
      { status: 500 }
    )
  }
}
