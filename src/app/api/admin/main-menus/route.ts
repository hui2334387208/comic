import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { mainMenus , mainMenuTranslations } from '@/db/schema/main_menus'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'


// 获取菜单列表（扁平结构，带所有翻译字段）
export async function GET(req: NextRequest) {
  // 权限检查
  const permissionCheck = await requirePermission('main-menu.read')(req)
  if (permissionCheck) {
    return permissionCheck
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  // 查询所有菜单
  const menus = await db.select().from(mainMenus).orderBy(mainMenus.order)
  // 查询所有翻译
  const translations = await db.select().from(mainMenuTranslations)
  // 合并
  const result = menus.map(menu => ({
    ...menu,
    translations: translations
      .filter(t => t.menuId === menu.id)
      .map(t => ({
        lang: t.lang,
        name: t.name,
        metaTitle: t.metaTitle,
        metaDescription: t.metaDescription,
        metaKeywords: t.metaKeywords,
      })),
  }))
  return NextResponse.json(result)
}


// 新增菜单（主表+翻译表）
export async function POST(req: NextRequest) {
  // 权限检查
  const permissionCheck = await requirePermission('main-menu.create')(req)
  if (permissionCheck) {
    return permissionCheck
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const body = await req.json()
  const now = new Date()
  const { translations, ...mainMenuData } = body

  // 启动事务
  const result = await db.transaction(async (trx) => {
    // 1. 插入主表
    const [menu] = await trx.insert(mainMenus).values({
      ...mainMenuData,
      createdAt: now,
      updatedAt: now,
    }).returning()
    if (!menu) throw new Error('主菜单插入失败')

    // 2. 插入翻译表
    if (Array.isArray(translations)) {
      const translationRows = translations.map(t => ({
        menuId: menu.id,
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
    return menu
  })

  return NextResponse.json(result)
}
