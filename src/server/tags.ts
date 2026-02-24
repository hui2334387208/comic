import { eq, asc } from 'drizzle-orm'

import { db } from '@/db'
import { comicTags } from '@/db/schema'

export async function fetchComicTagsForServer() {
  try {
    const tagsData = await db
      .select({
        id: comicTags.id,
        name: comicTags.name,
        slug: comicTags.slug,
        color: comicTags.color,
        status: comicTags.status,
      })
      .from(comicTags)
      .where(eq(comicTags.status, 'active'))
      .orderBy(asc(comicTags.name))

    return tagsData
  } catch (error) {
    console.error('Error fetching comic tags:', error)
    return []
  }
}
