import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { coupletCategories } from '@/db/schema'

export async function fetchCoupletCategoriesForServer() {
  try {
    const items = await db
      .select()
      .from(coupletCategories)
      .where(eq(coupletCategories.status, 'active'))
      .orderBy(coupletCategories.sortOrder)

    return Array.isArray(items) ? items : []
  } catch (error) {
    console.error('Error fetching couplet categories for server:', error)
    return []
  }
}