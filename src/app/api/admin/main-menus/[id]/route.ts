import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '../../../../../db'
import { mainMenus , mainMenuTranslations } from '../../../../../db/schema/main_menus'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'


// 获取菜单详情（带多语言翻译，返回translations数组结构）
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: number }> },
) {
  // 权限检查
  const permissionCheck = await requirePermission('main-menu.read')(req)
  if (permissionCheck) {
    return permissionCheck
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const { id } = await context.params
  const menuArr = await db.select().from(mainMenus).where(eq(mainMenus.id, id)).limit(1)
  const menu = menuArr[0]
  if (!menu) {
    return NextResponse.json({ message: 'Menu not found' }, { status: 404 })
  }
  const translations = await db.select().from(mainMenuTranslations).where(eq(mainMenuTranslations.menuId, id))
  return NextResponse.json({ ...menu, translations })
}

// 编辑菜单（主表+翻译表）
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: number }> },
) {
  // 权限检查
  const permissionCheck = await requirePermission('main-menu.update')(req)
  if (permissionCheck) {
    return permissionCheck
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const { id } = await context.params
  const data = await req.json()
  const { translations, ...mainMenuData } = data
  await db.transaction(async (trx) => {
    // 1. 更新主表
    await trx.update(mainMenus).set({ ...mainMenuData, updatedAt: new Date() }).where(eq(mainMenus.id, id))
    // 2. 删除原有翻译
    await trx.delete(mainMenuTranslations).where(eq(mainMenuTranslations.menuId, id))
    // 3. 插入新翻译
    if (Array.isArray(translations)) {
      const translationRows = translations.map(t => ({
        menuId: id,
        lang: t.lang,
        name: t.name,
        metaTitle: t.metaTitle,
        metaDescription: t.metaDescription,
        metaKeywords: t.metaKeywords,
      }))
      if (translationRows.length > 0) {
        await trx.insert(mainMenuTranslations).values(translationRows)
      }
    }
  })
  return NextResponse.json({ success: true })
}

// 删除菜单（主表+翻译表）
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: number }> },
) {
  // 权限检查
  const permissionCheck = await requirePermission('main-menu.delete')(req)
  if (permissionCheck) {
    return permissionCheck
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const { id } = await context.params
  await db.transaction(async (trx) => {
    await trx.delete(mainMenuTranslations).where(eq(mainMenuTranslations.menuId, id))
    await trx.delete(mainMenus).where(eq(mainMenus.id, id))
  })
  return NextResponse.json({ success: true })
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: number }> },
) {
  // 权限检查
  const permissionCheck = await requirePermission('main-menu.update')(req)
  if (permissionCheck) {
    return permissionCheck
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const { id } = await context.params
  const data = await req.json()
  const updateData: any = { updatedAt: new Date() }
  if (typeof data.status === 'string') updateData.status = data.status
  if (typeof data.isTop === 'boolean') updateData.isTop = data.isTop
  if (!('status' in updateData) && !('isTop' in updateData)) {
    return NextResponse.json({ error: 'Missing status or isTop' }, { status: 400 })
  }
  await db.update(mainMenus)
    .set(updateData)
    .where(eq(mainMenus.id, id))
  return NextResponse.json({ success: true })
}
