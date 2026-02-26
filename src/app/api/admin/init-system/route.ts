import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { 
  permissions, 
  roles, 
  rolePermissions, 
  adminMenus, 
  users, 
  userRoles 
} from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '@/lib/logger'
import { createReferralCode } from '@/lib/referral-utils'

// 导入初始化数据
import initMenusData from '@/data/init-menus.json'
import initPermissionsData from '@/data/init-permissions.json'
import initRolesData from '@/data/init-roles.json'
import initUsersData from '@/data/init-users.json'

export async function HEAD(request: NextRequest) {
  try {
    // 检查是否已经初始化过 - 通过检查是否有super-admin角色和对应的用户角色关联
    const superAdminRole = await db.query.roles.findFirst({
      where: eq(roles.name, 'super-admin')
    })
    
    if (superAdminRole) {
      const superAdminUserRole = await db.query.userRoles.findFirst({
        where: eq(userRoles.roleId, superAdminRole.id)
      })
      
      if (superAdminUserRole) {
        return new NextResponse(null, { status: 400 })
      }
    }
    
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // 检查是否已经初始化过 - 通过检查是否有super-admin角色和对应的用户角色关联
    const superAdminRole = await db.query.roles.findFirst({
      where: eq(roles.name, 'super-admin')
    })
    
    if (superAdminRole) {
      const superAdminUserRole = await db.query.userRoles.findFirst({
        where: eq(userRoles.roleId, superAdminRole.id)
      })
      
      if (superAdminUserRole) {
        return NextResponse.json({ 
          success: false,
          error: '系统已经初始化过了' 
        }, { status: 400 })
      }
    }

    const results = {
      permissions: { success: 0, failed: 0, total: 0 },
      roles: { success: 0, failed: 0, total: 0 },
      menus: { success: 0, failed: 0, total: 0 },
      adminUser: { success: false, error: null as string | null }
    }

    // 1. 初始化权限
    await logger.info({
      module: 'admin',
      action: 'init_permissions',
      description: '开始初始化权限数据'
    })

    for (const permission of initPermissionsData.permissions) {
      try {
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
        results.permissions.success++
      } catch (error) {
        console.error('权限创建失败:', permission.name, error)
        results.permissions.failed++
      }
      results.permissions.total++
    }

    // 2. 初始化角色
    await logger.info({
      module: 'admin',
      action: 'init_roles',
      description: '开始初始化角色数据'
    })

    for (const role of initRolesData.roles) {
      try {
        await db.insert(roles).values({
          id: role.id,
          name: role.name,
          displayName: role.displayName,
          description: role.description,
          isSystem: role.isSystem,
          created_at: new Date(),
          updated_at: new Date()
        })

        // 为角色分配权限
        if (role.permissions && role.permissions.length > 0) {
          // 如果是超级管理员角色，分配所有权限
          if ((role.name === 'super-admin' || role.name === 'admin') && role.permissions.includes('*')) {
            const allPermissions = await db.query.permissions.findMany()
            console.log(`为角色 ${role.name} 分配 ${allPermissions.length} 个权限`)
            for (const permission of allPermissions) {
              try {
                await db.insert(rolePermissions).values({
                  id: uuidv4(),
                  roleId: role.id,
                  permissionId: permission.id,
                  grantedBy: 'system',
                  grantedAt: new Date(),
                  isActive: true,
                  created_at: new Date(),
                  updated_at: new Date()
                })
                console.log(`权限分配成功: ${permission.name}`)
              } catch (error) {
                console.error('角色权限分配失败:', role.name, permission.name, error)
              }
            }
          } else {
            // 为其他角色分配指定权限
            for (const permissionName of role.permissions) {
              const permission = await db.query.permissions.findFirst({
                where: eq(permissions.name, permissionName)
              })
              if (permission) {
                try {
                  await db.insert(rolePermissions).values({
                    id: uuidv4(),
                    roleId: role.id,
                    permissionId: permission.id,
                    grantedBy: 'system',
                    grantedAt: new Date(),
                    isActive: true,
                    created_at: new Date(),
                    updated_at: new Date()
                  })
                } catch (error) {
                  console.error('角色权限分配失败:', role.name, permissionName, error)
                }
              }
            }
          }
        }

        results.roles.success++
      } catch (error) {
        console.error('角色创建失败:', role.name, error)
        results.roles.failed++
      }
      results.roles.total++
    }

    // 3. 初始化菜单
    await logger.info({
      module: 'admin',
      action: 'init_menus',
      description: '开始初始化菜单数据'
    })

    // 递归创建菜单
    const createMenu = async (menuData: any, parentId?: string) => {
      try {
        const menu = await db.insert(adminMenus).values({
          id: uuidv4(),
          key: menuData.key,
          label: menuData.label,
          path: menuData.path,
          icon: menuData.icon,
          parentId: parentId,
          permission: menuData.permission,
          order: menuData.order,
          isVisible: menuData.isVisible,
          isSystem: menuData.isSystem,
          created_at: new Date(),
          updated_at: new Date()
        }).returning()

        // 创建子菜单
        if (menuData.children && menuData.children.length > 0) {
          for (const child of menuData.children) {
            await createMenu(child, menu[0].id)
          }
        }

        results.menus.success++
      } catch (error) {
        console.error('菜单创建失败:', menuData.key, error)
        results.menus.failed++
      }
      results.menus.total++
    }

    for (const menu of initMenusData.menus) {
      await createMenu(menu)
    }

    // 4. 创建超级管理员账户
    await logger.info({
      module: 'admin',
      action: 'init_admin_user',
      description: '开始创建超级管理员账户'
    })

    try {
      // 从环境变量获取超级管理员信息
      const superAdminName = process.env.SUPER_ADMIN_NAME || 'deep_dream'
      const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'deep_dream@zohomail.com'
      const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Ms@9212840059'
      
      const hashedPassword = await bcrypt.hash(superAdminPassword, 12)
      
      const now = new Date()
      const [adminUser] = await db.insert(users).values({
        id: uuidv4(), // 自动生成UUID
        name: superAdminName,
        email: superAdminEmail,
        username: superAdminName,
        password: hashedPassword,
        emailVerified: now, // 设置邮箱验证时间为注册时间
        isLocked: false,
        failedLoginAttempts: 0,
        recentSuccessfulLogins: 0,
        loginFrequencyWarning: false,
        created_at: now,
        updated_at: now
      }).returning()

      // 为超级管理员分配super-admin角色
      const superAdminRole = await db.query.roles.findFirst({
        where: eq(roles.name, 'super-admin')
      })

      console.log('查找超级管理员角色:', superAdminRole)

      if (superAdminRole) {
        await db.insert(userRoles).values({
          id: uuidv4(),
          userId: adminUser.id,
          roleId: superAdminRole.id,
          assignedBy: 'system',
          assignedAt: new Date(),
          isActive: true,
          priority: 0,
          created_at: new Date(),
          updated_at: new Date()
        })
        console.log('超级管理员角色分配成功:', adminUser.id, superAdminRole.id)
      } else {
        console.error('未找到超级管理员角色')
      }

      // 为超级管理员创建邀请码
      const referralCodeResult = await createReferralCode(adminUser.id)
      if (referralCodeResult.success) {
        console.log('超级管理员邀请码创建成功:', referralCodeResult.code)
        await logger.info({
          module: 'admin',
          action: 'init_admin_user',
          description: `超级管理员邀请码创建成功: ${referralCodeResult.code}`,
          userId: adminUser.id
        })
      } else {
        console.warn('超级管理员邀请码创建失败:', referralCodeResult.message)
      }

      results.adminUser.success = true
    } catch (error) {
      console.error('超级管理员账户创建失败:', error)
      results.adminUser.error = error instanceof Error ? error.message : '未知错误'
    }

    await logger.info({
      module: 'admin',
      action: 'init_system_complete',
      description: `系统初始化完成 - 权限:${results.permissions.success}/${results.permissions.total}, 角色:${results.roles.success}/${results.roles.total}, 菜单:${results.menus.success}/${results.menus.total}, 管理员:${results.adminUser.success ? '成功' : '失败'}`
    })

    return NextResponse.json({
      success: true,
      message: '系统初始化完成',
      data: results
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'init_system_error',
      description: `系统初始化失败: ${error}`,
    })

    return NextResponse.json({
      success: false,
      error: '系统初始化失败'
    }, { status: 500 })
  }
}
