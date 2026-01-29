import { eq, sql, and, inArray, desc } from 'drizzle-orm'

import { db } from '@/db'
import {
  users,
  couplets,
  coupletCategories,
  coupletVersions,
  coupletContents,
} from '@/db/schema'

// 对联相关函数
export async function fetchCoupletRecommendData(type: string, limit: number, language: string) {
  // 构建基础查询
  const baseQuery = db
    .select({
      id: couplets.id,
      title: couplets.title,
      description: couplets.description,
      categoryId: couplets.categoryId,
      authorId: couplets.authorId,
      status: couplets.status,
      isPublic: couplets.isPublic,
      viewCount: couplets.viewCount,
      likeCount: couplets.likeCount,
      hot: couplets.hot,
      model: couplets.model,
      prompt: couplets.prompt,
      isFeatured: couplets.isFeatured,
      createdAt: couplets.createdAt,
      updatedAt: couplets.updatedAt,
      category: {
        id: coupletCategories.id,
        name: coupletCategories.name,
        slug: coupletCategories.slug,
        color: coupletCategories.color,
      },
      author: {
        id: users.id,
        name: users.name,
        username: users.username,
        avatar: users.avatar,
      },
    })
    .from(couplets)
    .leftJoin(coupletCategories, eq(couplets.categoryId, coupletCategories.id))
    .leftJoin(users, eq(couplets.authorId, users.id))
    .where(and(eq(couplets.isPublic, true), eq(couplets.language, language)))

  let coupletsData: any[] = await baseQuery

  // 获取对联内容
  const coupletIds = coupletsData.map(c => c.id)
  if (coupletIds.length > 0) {
    // 获取最新版本的对联内容
    const contents = await db
      .select({
        coupletId: coupletContents.coupletId,
        upperLine: coupletContents.upperLine,
        lowerLine: coupletContents.lowerLine,
        horizontalScroll: coupletContents.horizontalScroll,
        orderIndex: coupletContents.orderIndex,
      })
      .from(coupletContents)
      .innerJoin(coupletVersions, and(
        eq(coupletContents.versionId, coupletVersions.id),
        eq(coupletVersions.isLatestVersion, true)
      ))
      .where(inArray(coupletContents.coupletId, coupletIds))
      .orderBy(coupletContents.orderIndex)

    // 按 coupletId 分组内容
    const contentsMap = new Map<number, any[]>()
    contents.forEach(content => {
      if (!contentsMap.has(content.coupletId)) {
        contentsMap.set(content.coupletId, [])
      }
      contentsMap.get(content.coupletId)!.push(content)
    })

    // 将内容添加到对联数据中
    coupletsData = coupletsData.map(couplet => ({
      ...couplet,
      contents: contentsMap.get(couplet.id) || []
    }))
  }

  // 排序和筛选
  if (type === 'hot') {
    coupletsData.sort((a, b) => (b.hot || 0) - (a.hot || 0))
  } else if (type === 'featured') {
    coupletsData = coupletsData.filter(row => row.isFeatured)
  } else if (type === 'latest') {
    coupletsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  return coupletsData.slice(0, limit)
}

export interface HomeCoupletListResult<T = any> {
  success: boolean
  data: T[]
}

async function fetchHomeCoupletRecommend(
  type: 'hot' | 'latest' | 'featured',
  language: string,
  limit = 6,
): Promise<HomeCoupletListResult> {
  try {
    const data = await fetchCoupletRecommendData(type, limit, language)

    return {
      success: true,
      data: Array.isArray(data) ? data : [],
    }
  } catch (error) {
    console.error(`Error fetching home ${type} couplets:`, error)
    return {
      success: false,
      data: [],
    }
  }
}

export async function fetchHomeHotCouplets(language: string, limit = 6) {
  return fetchHomeCoupletRecommend('hot', language, limit)
}

export async function fetchHomeLatestCouplets(language: string, limit = 6) {
  return fetchHomeCoupletRecommend('latest', language, limit)
}

export async function fetchHomeFeaturedCouplets(language: string, limit = 6) {
  return fetchHomeCoupletRecommend('featured', language, limit)
}