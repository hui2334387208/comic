import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { adminMenus } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function POST(request: NextRequest) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('menu.create')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 先清空现有菜单数据
    await db.delete(adminMenus)

    // 从JSON文件导入菜单数据
    const menusData = require('@/data/init-menus.json')
    
    // 插入所有菜单数据
    const insertPromises = []
    
    for (const menu of menusData.menus) {
      // 插入父菜单
      insertPromises.push(
        db.insert(adminMenus).values({
          id: menu.id,
          key: menu.key,
          label: menu.label,
          path: menu.path,
          icon: menu.icon,
          parentId: null,
          permission: menu.permission,
          order: menu.order,
          isVisible: menu.isVisible,
          isSystem: menu.isSystem,
          created_at: new Date(),
          updated_at: new Date(),
        })
      )

      // 插入子菜单
      if (menu.children && menu.children.length > 0) {
        for (const child of menu.children) {
          insertPromises.push(
            db.insert(adminMenus).values({
              id: child.id,
              key: child.key,
              label: child.label,
              path: child.path,
              icon: child.icon,
              parentId: menu.id,
              permission: child.permission,
              order: child.order,
              isVisible: child.isVisible,
              isSystem: child.isSystem,
              created_at: new Date(),
              updated_at: new Date(),
            })
          )
        }
      }
    }

    // 执行所有插入操作
    await Promise.all(insertPromises)

    // 验证插入结果
    const insertedMenus = await db.query.adminMenus.findMany()
    const parentMenus = insertedMenus.filter(menu => !menu.parentId)
    const childMenus = insertedMenus.filter(menu => menu.parentId)

    await logger.info({
      module: 'admin',
      action: 'init_menus',
      description: `管理员初始化默认菜单 - 父菜单: ${parentMenus.length}, 子菜单: ${childMenus.length}`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      message: `默认菜单初始化成功 - 父菜单: ${parentMenus.length}, 子菜单: ${childMenus.length}`,
      data: {
        parentMenus: parentMenus.length,
        childMenus: childMenus.length,
        totalMenus: insertedMenus.length
      }
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'init_menus_error',
      description: `初始化菜单时出错: ${error}`,
    })

    return NextResponse.json(
      { error: `初始化菜单失败: ${error}` },
      { status: 500 }
    )
  }
}