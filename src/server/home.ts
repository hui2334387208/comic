import { eq, and, inArray } from 'drizzle-orm'

import { db } from '@/db'
import {
  users,
  comics,
  comicCategories,
  comicTags,
  comicTagRelations,
} from '@/db/schema'

// 漫画相关函数
export async function fetchComicRecommendData(type: string, limit: number, language: string) {
  // 构建基础查询
  const baseQuery = db
    .select({
      id: comics.id,
      title: comics.title,
      slug: comics.slug,
      description: comics.description,
      categoryId: comics.categoryId,
      authorId: comics.authorId,
      status: comics.status,
      isPublic: comics.isPublic,
      viewCount: comics.viewCount,
      likeCount: comics.likeCount,
      hot: comics.hot,
      model: comics.model,
      prompt: comics.prompt,
      isFeatured: comics.isFeatured,
      language: comics.language,
      coverImage: comics.coverImage,
      volumeCount: comics.volumeCount,
      episodeCount: comics.episodeCount,
      style: comics.style,
      createdAt: comics.createdAt,
      updatedAt: comics.updatedAt,
      category: {
        id: comicCategories.id,
        name: comicCategories.name,
        slug: comicCategories.slug,
        icon: comicCategories.icon,
        color: comicCategories.color,
      },
      author: {
        id: users.id,
        name: users.name,
        username: users.username,
        avatar: users.avatar,
      },
    })
    .from(comics)
    .leftJoin(comicCategories, eq(comics.categoryId, comicCategories.id))
    .leftJoin(users, eq(comics.authorId, users.id))
    .where(and(eq(comics.isPublic, true), eq(comics.language, language)))

  let comicsData: any[] = await baseQuery

  // 获取标签
  const comicIds = comicsData.map(c => c.id)
  if (comicIds.length > 0) {
    const tagRelations = await db
      .select({
        comicId: comicTagRelations.comicId,
        tagId: comicTags.id,
        tagName: comicTags.name,
        tagSlug: comicTags.slug,
        tagColor: comicTags.color,
      })
      .from(comicTagRelations)
      .innerJoin(comicTags, eq(comicTagRelations.tagId, comicTags.id))
      .where(inArray(comicTagRelations.comicId, comicIds))

    // 按 comicId 分组标签
    const tagsMap = new Map<number, any[]>()
    tagRelations.forEach(relation => {
      if (!tagsMap.has(relation.comicId)) {
        tagsMap.set(relation.comicId, [])
      }
      tagsMap.get(relation.comicId)!.push({
        id: relation.tagId,
        name: relation.tagName,
        slug: relation.tagSlug,
        color: relation.tagColor,
      })
    })

    // 将标签添加到漫画数据中
    comicsData = comicsData.map(comic => ({
      ...comic,
      tags: tagsMap.get(comic.id) || []
    }))
  }

  // 排序和筛选
  if (type === 'hot') {
    comicsData.sort((a, b) => (b.hot || 0) - (a.hot || 0))
  } else if (type === 'featured') {
    comicsData = comicsData.filter(row => row.isFeatured)
  } else if (type === 'latest') {
    comicsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  return comicsData.slice(0, limit)
}

export interface HomeComicListResult<T = any> {
  success: boolean
  data: T[]
}

async function fetchHomeComicRecommend(
  type: 'hot' | 'latest' | 'featured',
  language: string,
  limit = 6,
): Promise<HomeComicListResult> {
  try {
    const data = await fetchComicRecommendData(type, limit, language)

    return {
      success: true,
      data: Array.isArray(data) ? data : [],
    }
  } catch (error) {
    console.error(`Error fetching home ${type} comics:`, error)
    return {
      success: false,
      data: [],
    }
  }
}

export async function fetchHomeHotComics(language: string, limit = 6) {
  return fetchHomeComicRecommend('hot', language, limit)
}

export async function fetchHomeLatestComics(language: string, limit = 6) {
  return fetchHomeComicRecommend('latest', language, limit)
}

export async function fetchHomeFeaturedComics(language: string, limit = 6) {
  return fetchHomeComicRecommend('featured', language, limit)
}
