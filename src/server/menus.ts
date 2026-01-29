import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { mainMenus, mainMenuTranslations } from '@/db/schema'

export interface MenuData {
  id: number
  name: string
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
  [key: string]: any
}

/**
 * 根据路径获取菜单数据（用于生成 metadata）
 * @param path 菜单路径
 * @param locale 语言代码
 * @returns 菜单数据或 null
 */
export async function fetchMenuByPath(path: string, locale: string): Promise<MenuData | null> {
  try {
    const menus = await db
      .select()
      .from(mainMenus)
      .where(
        and(
          eq(mainMenus.path, path),
          eq(mainMenus.isTop, true),
          eq(mainMenus.status, 'active')
        )
      )
      .orderBy(mainMenus.order)
      .limit(1)

    const menu = menus[0]
    if (!menu) {
      return null
    }

    // 查询翻译
    const translations = await db
      .select()
      .from(mainMenuTranslations)
      .where(
        and(
          eq(mainMenuTranslations.menuId, menu.id),
          eq(mainMenuTranslations.lang, locale)
        )
      )
      .limit(1)

    const trans = translations[0] || {}
    return {
      ...menu,
      name: trans.name || '',
      metaTitle: trans.metaTitle || '',
      metaDescription: trans.metaDescription || '',
      metaKeywords: trans.metaKeywords || '',
    }
  } catch (error) {
    console.error('Error fetching menu:', error)
    return null
  }
}
