import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { roles, userRoles, rolePermissions, permissions } from '@/db/schema'
import { eq, count, and } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('role.read')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await params

    const role = await db.query.roles.findFirst({
      where: eq(roles.id, id)
    })

    if (!role) {
      return NextResponse.json({ error: '角色不存在' }, { status: 404 })
    }

    // 获取用户数量
    const userCountResult = await db
      .select({ count: count() })
      .from(userRoles)
      .where(eq(userRoles.roleId, id))

    // 获取权限列表
    const rolePermissionsData = await db
      .select({
        permissionId: rolePermissions.permissionId,
        permissionName: permissions.name,
        permissionDisplayName: permissions.displayName,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(rolePermissions.roleId, id),
          eq(rolePermissions.isActive, true)
        )
      )

    const roleWithDetails = {
      ...role,
      userCount: userCountResult[0]?.count || 0,
      permissions: rolePermissionsData.map(rp => rp.permissionId),
      permissionDetails: rolePermissionsData
    }

    await logger.info({
      module: 'admin',
      action: 'get_role_detail',
      description: `管理员查看角色详情: ${role.name}`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: roleWithDetails
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'get_role_detail_error',
      description: `获取角色详情时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '获取角色详情失败' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('role.update')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, displayName, description, permissions } = body

    // 检查角色是否存在
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.id, id)
    })

    if (!existingRole) {
      return NextResponse.json({ error: '角色不存在' }, { status: 404 })
    }


    // 如果要修改角色名称，检查是否已被使用
    if (name && name !== existingRole.name) {
      const nameExists = await db.query.roles.findFirst({
        where: eq(roles.name, name)
      })

      if (nameExists) {
        return NextResponse.json({ error: '角色名称已被使用' }, { status: 400 })
      }
    }

    // 更新角色基本信息
    const updatedRole = await db
      .update(roles)
      .set({
        name: name || existingRole.name,
        displayName: displayName || existingRole.displayName,
        description: description !== undefined ? description : existingRole.description,
        updated_at: new Date()
      })
      .where(eq(roles.id, id))
      .returning()

    // 如果提供了权限列表，更新角色权限关联
    if (permissions && Array.isArray(permissions)) {
      // 先删除现有的权限关联
      await db
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, id))

      // 添加新的权限关联
      if (permissions.length > 0) {
        const permissionInserts = permissions.map((permissionId: string) => ({
          id: `${id}_${permissionId}_${Date.now()}`,
          roleId: id,
          permissionId,
          grantedBy: session.user.id || 'system',
          grantedAt: new Date(),
          isActive: true,
          created_at: new Date(),
          updated_at: new Date()
        }))

        await db.insert(rolePermissions).values(permissionInserts)
      }
    }

    await logger.info({
      module: 'admin',
      action: 'update_role',
      description: `管理员更新角色: ${existingRole.name}`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: updatedRole[0]
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'update_role_error',
      description: `更新角色时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '更新角色失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('role.delete')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await params

    // 检查角色是否存在
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.id, id)
    })

    if (!existingRole) {
      return NextResponse.json({ error: '角色不存在' }, { status: 404 })
    }

    // 检查是否有用户使用此角色
    const userCountResult = await db
      .select({ count: count() })
      .from(userRoles)
      .where(eq(userRoles.roleId, id))

    if (userCountResult[0]?.count > 0) {
      return NextResponse.json({ error: '该角色下还有用户，无法删除' }, { status: 400 })
    }

    // 删除角色
    await db.delete(roles).where(eq(roles.id, id))

    await logger.info({
      module: 'admin',
      action: 'delete_role',
      description: `管理员删除角色: ${existingRole.name}`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      message: '角色删除成功'
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'delete_role_error',
      description: `删除角色时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '删除角色失败' },
      { status: 500 }
    )
  }
}
