import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { adminMenus } from '@/db/schema'
import { eq, asc, isNull } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'
import { getUserPermissionsFromDB } from '@/lib/permissions'

// 根据权限过滤菜单
function filterMenusByPermission(menus: any[], userPermissions: string[]): any[] {
  return menus.filter(menu => {
    // 如果没有设置权限，则显示
    if (!menu.permission) {
      return true
    }

    // 检查用户是否有该权限
    const hasPermission = userPermissions.includes(menu.permission) || userPermissions.includes('*')
    
    if (!hasPermission) {
      return false
    }

    // 如果有子菜单，递归过滤
    if (menu.children && menu.children.length > 0) {
      const filteredChildren = filterMenusByPermission(menu.children, userPermissions)
      if (filteredChildren.length > 0) {
        menu.children = filteredChildren
        return true
      } else {
        return false
      }
    }

    return true
  })
}

// 获取菜单列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 获取用户权限
    const userPermissions = await getUserPermissionsFromDB(session.user.id)

    // 获取所有菜单，按层级和排序
    const menus = await db.query.adminMenus.findMany({
      where: eq(adminMenus.isVisible, true),
      orderBy: [asc(adminMenus.order), asc(adminMenus.created_at)]
    })

    // 根据用户权限过滤菜单
    const filteredMenus = filterMenusByPermission(menus, userPermissions.permissions)

    // 构建树形结构
    const menuTree = buildMenuTree(filteredMenus)

    await logger.info({
      module: 'admin',
      action: 'get_menus',
      description: '管理员获取菜单列表',
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: menuTree
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'get_menus_error',
      description: `获取菜单列表时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '获取菜单列表失败' },
      { status: 500 }
    )
  }
}

// 创建菜单
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

    const body = await request.json()
    const { 
      key, 
      label, 
      path, 
      icon, 
      parentId, 
      permission, 
      order = 0, 
      isVisible = true,
      meta = {}
    } = body

    // 验证必填字段
    if (!key || !label || !path) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    // 检查菜单key是否已存在
    const existingMenu = await db.query.adminMenus.findFirst({
      where: eq(adminMenus.key, key)
    })

    if (existingMenu) {
      return NextResponse.json({ error: '菜单标识已存在' }, { status: 400 })
    }

    // 创建菜单
    const newMenu = await db.insert(adminMenus).values({
      id: crypto.randomUUID(),
      key,
      label,
      path,
      icon,
      parentId: parentId || null,
      permission,
      order,
      isVisible,
      meta,
      created_at: new Date(),
      updated_at: new Date()
    }).returning()

    await logger.info({
      module: 'admin',
      action: 'create_menu',
      description: `管理员创建菜单: ${key}`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: newMenu[0]
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'create_menu_error',
      description: `创建菜单时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '创建菜单失败' },
      { status: 500 }
    )
  }
}

// 构建菜单树形结构
function buildMenuTree(menus: any[]): any[] {
  const menuMap = new Map()
  const rootMenus: any[] = []

  // 创建菜单映射
  menus.forEach(menu => {
    menuMap.set(menu.id, { ...menu, children: [] })
  })

  // 构建树形结构
  menus.forEach(menu => {
    const menuItem = menuMap.get(menu.id)
    if (menu.parentId) {
      const parent = menuMap.get(menu.parentId)
      if (parent) {
        parent.children.push(menuItem)
      }
    } else {
      rootMenus.push(menuItem)
    }
  })

  return rootMenus
}
