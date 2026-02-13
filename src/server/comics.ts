import { eq, and, or, like, inArray, desc, asc, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  comics,
  comicCategories,
  comicTags,
  comicTagRelations,
  comicVersions,
  comicVolumes,
  comicEpisodes,
  users,
} from '@/db/schema'

interface FetchComicListParams {
  page?: number
  limit?: number
  sort?: 'latest' | 'hot' | 'contents'
  category?: string | null
  search?: string | null
  language?: string
}

export async function fetchComicListForServer(params: FetchComicListParams) {
  const {
    page = 1,
    limit = 12,
    sort = 'latest',
    category = null,
    search = null,
    language = 'zh',
  } = params

  try {
    const offset = (page - 1) * limit

    // 构建查询条件
    const conditions = [
      eq(comics.isPublic, true),
      eq(comics.language, language),
    ]

    // 分类筛选
    if (category) {
      const categoryData = await db
        .select({ id: comicCategories.id })
        .from(comicCategories)
        .where(eq(comicCategories.slug, category))
        .limit(1)

      if (categoryData.length > 0) {
        conditions.push(eq(comics.categoryId, categoryData[0].id))
      }
    }

    // 搜索筛选
    if (search) {
      conditions.push(
        or(
          like(comics.title, `%${search}%`),
          like(comics.description, `%${search}%`),
          like(comics.prompt, `%${search}%`)
        )!
      )
    }

    // 查询漫画列表
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
      .where(and(...conditions))

    // 排序
    let comicsData
    if (sort === 'hot') {
      comicsData = await baseQuery.orderBy(desc(comics.hot), desc(comics.createdAt)).limit(limit).offset(offset)
    } else if (sort === 'contents') {
      comicsData = await baseQuery.orderBy(desc(comics.episodeCount), desc(comics.createdAt)).limit(limit).offset(offset)
    } else {
      comicsData = await baseQuery.orderBy(desc(comics.createdAt)).limit(limit).offset(offset)
    }

    // 获取总数
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(comics)
      .where(and(...conditions))

    const totalCount = Number(count)
    const totalPages = Math.ceil(totalCount / limit)

    // 获取标签
    const comicIds = comicsData.map(c => c.id)
    let tagsMap = new Map<number, any[]>()

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
    }

    // 组装数据
    const comicsWithTags = comicsData.map(comic => ({
      ...comic,
      tags: tagsMap.get(comic.id) || [],
    }))

    return {
      success: true,
      data: {
        comics: comicsWithTags,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
        },
      },
    }
  } catch (error) {
    console.error('Error fetching comic list:', error)
    return {
      success: false,
      data: {
        comics: [],
        pagination: {
          page: 1,
          limit,
          totalCount: 0,
          totalPages: 0,
        },
      },
      error: 'Failed to fetch comics',
    }
  }
}

// 获取漫画分类列表
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

// 获取漫画标签列表
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
