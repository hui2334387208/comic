import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { roles, userRoles, rolePermissions, permissions } from '@/db/schema'
import { eq, count, and } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

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

    // 获取每个角色的用户数量和权限信息
    const rolesWithDetails = await Promise.all(
      rolesList.map(async (role) => {
        // 获取用户数量
        const userCountResult = await db
          .select({ count: count() })
          .from(userRoles)
          .where(eq(userRoles.roleId, role.id))

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
              eq(rolePermissions.roleId, role.id),
              eq(rolePermissions.isActive, true)
            )
          )

        return {
          ...role,
          userCount: userCountResult[0]?.count || 0,
          permissions: rolePermissionsData.map(rp => rp.permissionId),
          permissionDetails: rolePermissionsData
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
      data: rolesWithDetails
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
    const { name, displayName, description } = body

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
      created_at: new Date(),
      updated_at: new Date()
    }).returning()

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
