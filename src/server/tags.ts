import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { coupletTags } from '@/db/schema'

export async function fetchCoupletTagsForServer() {
  try {
    const items = await db
      .select()
      .from(coupletTags)
      .where(eq(coupletTags.status, 'active'))
      .orderBy(coupletTags.createdAt)

    return Array.isArray(items) ? items : []
  } catch (error) {
    console.error('Error fetching couplet tags for server:', error)
    return []
  }
}


