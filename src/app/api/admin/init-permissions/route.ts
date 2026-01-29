import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { roles, permissions, rolePermissions } from '@/db/schema'
import { logger } from '@/lib/logger'
import permissionsData from '@/data/init-permissions.json'
import rolesData from '@/data/init-roles.json'
import { requirePermission } from '@/lib/permission-middleware'

export async function POST(request: NextRequest) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('permission.create')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 检查是否已有权限数据
    const existingPermissions = await db.query.permissions.findMany()
    if (existingPermissions.length > 0) {
      return NextResponse.json({
        success: false,
        message: '权限数据已存在，跳过初始化'
      })
    }

    // 初始化权限
    for (const permission of permissionsData.permissions) {
      await db.insert(permissions).values({
        id: permission.id,
        name: permission.name,
        displayName: permission.displayName,
        description: permission.description,
        module: permission.module,
        action: permission.action,
        resource: permission.resource,
        type: permission.type,
        isSystem: permission.isSystem,
        created_at: new Date(),
        updated_at: new Date()
      })
    }

    // 初始化角色
    for (const role of rolesData.roles) {
      await db.insert(roles).values({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        isSystem: role.isSystem,
        created_at: new Date(),
        updated_at: new Date()
      })
    }

    // 初始化角色权限关联
    for (const role of rolesData.roles) {
      if (role.permissions && role.permissions.length > 0) {
        for (const permissionName of role.permissions) {
          // 查找权限ID
          const permission = permissionsData.permissions.find(p => p.name === permissionName)
          if (permission) {
            await db.insert(rolePermissions).values({
              id: `${role.id}-${permission.id}`,
              roleId: role.id,
              permissionId: permission.id,
              grantedBy: session.user.id,
              grantedAt: new Date(),
              isActive: true,
              created_at: new Date(),
              updated_at: new Date()
            })
          }
        }
      }
    }

    await logger.info({
      module: 'admin',
      action: 'init_permissions',
      description: '管理员初始化权限数据',
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      message: '权限初始化成功'
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'init_permissions_error',
      description: `初始化权限时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '初始化权限失败' },
      { status: 500 }
    )
  }
}
