import { and, eq, inArray } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '../../../db'
import { mainMenus , mainMenuTranslations } from '../../../db/schema/main_menus'
import { publicApiRateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const rateLimit = publicApiRateLimit(req)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: '请求过于频繁，请稍后再试' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfter ?? Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
        },
      },
    )
  }

  const { searchParams } = new URL(req.url)
  const lang = searchParams.get('lang')
  const status = searchParams.get('status')
  const isTop = searchParams.get('isTop')
  const pathParam = searchParams.get('path')

  // 动态构建 where 条件
  const whereConds = []
  if (isTop !== null) whereConds.push(eq(mainMenus.isTop, isTop === 'true' || isTop === '1'))
  if (status) whereConds.push(eq(mainMenus.status, status))
  if (pathParam) whereConds.push(eq(mainMenus.path, pathParam))

  // 只查 isTop=true 且 status=active，按 order 升序
  const menus = await db.select().from(mainMenus)
    .where(and(...whereConds))
    .orderBy(mainMenus.order)
  const menuIds = menus.map(m => m.id)
  let translations: any[] = []
  if (menuIds.length > 0 && lang) {
    translations = await db.select().from(mainMenuTranslations)
      .where(and(inArray(mainMenuTranslations.menuId, menuIds), eq(mainMenuTranslations.lang, lang)))
  }
  // 合并翻译，平铺到菜单对象上
  const result = menus.map(menu => {
    const t = translations.find(tr => tr.menuId === menu.id) || {}
    return {
      ...menu,
      name: t.name || '',
      metaTitle: t.metaTitle || '',
      metaDescription: t.metaDescription || '',
      metaKeywords: t.metaKeywords || '',
    }
  })

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}
