import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { users, userRoles, roles } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const user = await db.query.users.findFirst({
      where: eq(users.id, id)
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 获取用户角色
    const userRolesData = await db
      .select({
        roleId: userRoles.roleId,
        roleName: roles.displayName
      })
      .from(userRoles)
      .leftJoin(roles, eq(roles.id, userRoles.roleId))
      .where(
        and(
          eq(userRoles.userId, id),
          eq(userRoles.isActive, true)
        )
      )

    const userWithRoles = {
      ...user,
      roles: userRolesData.map(ur => ({
        id: ur.roleId,
        name: ur.roleName
      }))
    }

    await logger.info({
      module: 'admin',
      action: 'get_user_detail',
      description: `管理员查看用户详情: ${user.email}`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: userWithRoles
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'get_user_detail_error',
      description: `获取用户详情时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '获取用户详情失败' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    // 权限检查
    const permissionCheck = await requirePermission('user.update')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, email, username, role, profile, avatar } = body

    // 检查用户是否存在
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, id)
    })

    if (!existingUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 如果要修改邮箱，检查是否已被使用
    if (email && email !== existingUser.email) {
      const emailExists = await db.query.users.findFirst({
        where: eq(users.email, email)
      })

      if (emailExists) {
        return NextResponse.json({ error: '邮箱已被使用' }, { status: 400 })
      }
    }

    // 如果要修改用户名，检查是否已被使用
    if (username && username !== existingUser.username) {
      const usernameExists = await db.query.users.findFirst({
        where: eq(users.username, username)
      })

      if (usernameExists) {
        return NextResponse.json({ error: '用户名已被使用' }, { status: 400 })
      }
    }

    // 更新用户信息
    const updatedUser = await db
      .update(users)
      .set({
        name: name || existingUser.name,
        email: email || existingUser.email,
        username: username || existingUser.username,
        role: role || existingUser.role,
        profile: profile !== undefined ? profile : existingUser.profile,
        avatar: avatar !== undefined ? avatar : existingUser.avatar,
        updated_at: new Date()
      })
      .where(eq(users.id, id))
      .returning()

    await logger.info({
      module: 'admin',
      action: 'update_user',
      description: `管理员更新用户信息: ${existingUser.email}`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: updatedUser[0]
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'update_user_error',
      description: `更新用户信息时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '更新用户信息失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    // 权限检查
    const permissionCheck = await requirePermission('user.delete')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await params

    // 检查用户是否存在
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, id)
    })

    if (!existingUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 不能删除自己
    if (id === session.user.id) {
      return NextResponse.json({ error: '不能删除自己的账户' }, { status: 400 })
    }

    // 删除用户
    await db.delete(users).where(eq(users.id, id))

    await logger.info({
      module: 'admin',
      action: 'delete_user',
      description: `管理员删除用户: ${existingUser.email}`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      message: '用户删除成功'
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'delete_user_error',
      description: `删除用户时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '删除用户失败' },
      { status: 500 }
    )
  }
}
