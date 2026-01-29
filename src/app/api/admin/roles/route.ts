import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { roles, rolePermissions, permissions, userRoles } from '@/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

// 获取角色列表
export async function GET(request: NextRequest) {
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

    const rolesList = await db.query.roles.findMany({
      orderBy: (roles, { desc }) => [desc(roles.created_at)]
    })

    // 为每个角色添加用户数量和权限信息
    const rolesWithStats = await Promise.all(
      rolesList.map(async (role) => {
        // 获取该角色的用户数量
        const userCountResult = await db
          .select({ count: count() })
          .from(userRoles)
          .where(and(
            eq(userRoles.roleId, role.id),
            eq(userRoles.isActive, true)
          ))
        
        const userCount = userCountResult[0]?.count || 0

        // 获取该角色的权限列表
        const rolePermissionsList = await db
          .select({
            permission: permissions
          })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(and(
            eq(rolePermissions.roleId, role.id),
            eq(rolePermissions.isActive, true)
          ))

        return {
          ...role,
          userCount,
          permissions: rolePermissionsList.map(rp => rp.permission.id)
        }
      })
    )

    await logger.info({
      module: 'admin',
      action: 'get_roles',
      description: '管理员获取角色列表',
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: rolesWithStats
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'get_roles_error',
      description: `获取角色列表时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '获取角色列表失败' },
      { status: 500 }
    )
  }
}

// 创建角色
export async function POST(request: NextRequest) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('role.create')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const { name, displayName, description, permissionIds } = body

    // 验证必填字段
    if (!name || !displayName) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    // 检查角色名称是否已存在
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.name, name)
    })

    if (existingRole) {
      return NextResponse.json({ error: '角色名称已存在' }, { status: 400 })
    }

    // 创建角色
    const newRole = await db.insert(roles).values({
      id: crypto.randomUUID(),
      name,
      displayName,
      description,
      isSystem: false,
      created_at: new Date(),
      updated_at: new Date()
    }).returning()

    // 分配权限
    if (permissionIds && permissionIds.length > 0) {
      for (const permissionId of permissionIds) {
        await db.insert(rolePermissions).values({
          id: `${newRole[0].id}-${permissionId}`,
          roleId: newRole[0].id,
          permissionId,
          grantedBy: session.user.id,
          grantedAt: new Date(),
          isActive: true,
          created_at: new Date(),
          updated_at: new Date()
        })
      }
    }

    await logger.info({
      module: 'admin',
      action: 'create_role',
      description: `管理员创建角色: ${name}`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: newRole[0]
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'create_role_error',
      description: `创建角色时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '创建角色失败' },
      { status: 500 }
    )
  }
}

// 更新角色
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { id, name, displayName, description, permissionIds } = body

    // 验证必填字段
    if (!id || !name || !displayName) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    // 检查角色是否存在
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.id, id)
    })

    if (!existingRole) {
      return NextResponse.json({ error: '角色不存在' }, { status: 400 })
    }

    // 检查是否为系统角色
    if (existingRole.isSystem) {
      return NextResponse.json({ error: '系统角色不能修改' }, { status: 400 })
    }

    // 更新角色
    const updatedRole = await db
      .update(roles)
      .set({
        name,
        displayName,
        description,
        updated_at: new Date()
      })
      .where(eq(roles.id, id))
      .returning()

    // 更新权限（先删除现有权限，再添加新权限）
    if (permissionIds !== undefined) {
      // 删除现有权限
      await db
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, id))

      // 添加新权限
      if (permissionIds.length > 0) {
        for (const permissionId of permissionIds) {
          await db.insert(rolePermissions).values({
            id: `${id}-${permissionId}`,
            roleId: id,
            permissionId,
            grantedBy: session.user.id,
            grantedAt: new Date(),
            isActive: true,
            created_at: new Date(),
            updated_at: new Date()
          })
        }
      }
    }

    await logger.info({
      module: 'admin',
      action: 'update_role',
      description: `管理员更新角色: ${name}`,
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

// 删除角色
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('roleId')

    if (!roleId) {
      return NextResponse.json({ error: '缺少角色ID参数' }, { status: 400 })
    }

    // 检查角色是否存在
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.id, roleId)
    })

    if (!existingRole) {
      return NextResponse.json({ error: '角色不存在' }, { status: 400 })
    }

    // 检查是否为系统角色
    if (existingRole.isSystem) {
      return NextResponse.json({ error: '系统角色不能删除' }, { status: 400 })
    }

    // 删除角色权限关联
    await db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId))

    // 删除角色
    await db
      .delete(roles)
      .where(eq(roles.id, roleId))

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
