import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { adminMenus } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

// 获取单个菜单
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('menu.read')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await params

    const menu = await db.query.adminMenus.findFirst({
      where: eq(adminMenus.id, id)
    })

    if (!menu) {
      return NextResponse.json({ error: '菜单不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: menu
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'get_menu_error',
      description: `获取菜单详情时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '获取菜单详情失败' },
      { status: 500 }
    )
  }
}

// 更新菜单
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('menu.update')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { 
      key, 
      label, 
      path, 
      icon, 
      parentId, 
      permission, 
      order, 
      isVisible,
      meta
    } = body

    // 检查菜单是否存在
    const existingMenu = await db.query.adminMenus.findFirst({
      where: eq(adminMenus.id, id)
    })

    if (!existingMenu) {
      return NextResponse.json({ error: '菜单不存在' }, { status: 404 })
    }

    // 如果更新key，检查是否重复
    if (key && key !== existingMenu.key) {
      const duplicateMenu = await db.query.adminMenus.findFirst({
        where: eq(adminMenus.key, key)
      })

      if (duplicateMenu) {
        return NextResponse.json({ error: '菜单标识已存在' }, { status: 400 })
      }
    }

    // 更新菜单
    const updatedMenu = await db.update(adminMenus)
      .set({
        key: key || existingMenu.key,
        label: label || existingMenu.label,
        path: path || existingMenu.path,
        icon: icon !== undefined ? icon : existingMenu.icon,
        parentId: parentId !== undefined ? parentId : existingMenu.parentId,
        permission: permission !== undefined ? permission : existingMenu.permission,
        order: order !== undefined ? order : existingMenu.order,
        isVisible: isVisible !== undefined ? isVisible : existingMenu.isVisible,
        meta: meta !== undefined ? meta : existingMenu.meta,
        updated_at: new Date()
      })
      .where(eq(adminMenus.id, id))
      .returning()

    await logger.info({
      module: 'admin',
      action: 'update_menu',
      description: `管理员更新菜单: ${id}`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: updatedMenu[0]
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'update_menu_error',
      description: `更新菜单时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '更新菜单失败' },
      { status: 500 }
    )
  }
}

// 删除菜单
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('menu.delete')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await params

    // 检查菜单是否存在
    const existingMenu = await db.query.adminMenus.findFirst({
      where: eq(adminMenus.id, id)
    })

    if (!existingMenu) {
      return NextResponse.json({ error: '菜单不存在' }, { status: 404 })
    }

    // 检查是否为系统菜单
    if (existingMenu.isSystem) {
      return NextResponse.json({ error: '系统菜单不能删除' }, { status: 400 })
    }

    // 检查是否有子菜单
    const childMenus = await db.query.adminMenus.findMany({
      where: eq(adminMenus.parentId, id)
    })

    if (childMenus.length > 0) {
      return NextResponse.json({ error: '请先删除子菜单' }, { status: 400 })
    }

    // 删除菜单
    await db.delete(adminMenus).where(eq(adminMenus.id, id))

    await logger.info({
      module: 'admin',
      action: 'delete_menu',
      description: `管理员删除菜单: ${id}`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      message: '菜单删除成功'
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'delete_menu_error',
      description: `删除菜单时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '删除菜单失败' },
      { status: 500 }
    )
  }
}
