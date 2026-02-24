import { eq, asc } from 'drizzle-orm'

import { db } from '@/db'
import { comicCategories } from '@/db/schema'

export async function fetchComicCategoriesForServer() {
  try {
    const categoriesData = await db
      .select({
        id: comicCategories.id,
        name: comicCategories.name,
        slug: comicCategories.slug,
        description: comicCategories.description,
        icon: comicCategories.icon,
        color: comicCategories.color,
        status: comicCategories.status,
        sortOrder: comicCategories.sortOrder,
      })
      .from(comicCategories)
      .where(eq(comicCategories.status, 'active'))
      .orderBy(asc(comicCategories.sortOrder), asc(comicCategories.id))

    return categoriesData
  } catch (error) {
    console.error('Error fetching comic categories:', error)
    return []
  }
}
