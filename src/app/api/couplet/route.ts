import { eq, and, desc, asc, ilike, sql, inArray } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/db'
import { couplets, coupletCategories, coupletContents, coupletVersions, users, coupletTagRelations, coupletTags } from '@/db/schema'
import { publicApiRateLimit } from '@/lib/rate-limit'

// GET /api/couplet - 获取对联列表
export async function GET(request: NextRequest) {
  try {
    const rateLimit = publicApiRateLimit(request)
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const sort = searchParams.get('sort') || 'latest'
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const language = searchParams.get('language') || 'zh'

    const result = await fetchCoupletList({ page, limit, sort, category, search, language })

    return NextResponse.json(result)
  } catch (error) {
    console.error('获取对联列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取对联列表失败' },
      { status: 500 },
    )
  }
}

// 提取查询逻辑为独立函数
async function fetchCoupletList({
  page = 1,
  limit = 12,
  sort = 'latest',
  category = null,
  search = null,
  language = 'zh'
}: {
  page?: number
  limit?: number
  sort?: string
  category?: string | null
  search?: string | null
  language?: string
}) {
  const offset = (page - 1) * limit

  // 构建查询条件
  const whereConds = [
    eq(couplets.status, 'published'),
    eq(couplets.isPublic, true)
  ]

  // 分类筛选
  if (category && category !== 'all') {
    const categoryRecord = await db
      .select({ id: coupletCategories.id })
      .from(coupletCategories)
      .where(eq(coupletCategories.slug, category))
      .limit(1)
    
    if (categoryRecord.length > 0) {
      whereConds.push(eq(couplets.categoryId, categoryRecord[0].id))
    }
  }

  // 搜索条件
  if (search) {
    whereConds.push(
      sql`(${couplets.title} ILIKE ${`%${search}%`} OR ${couplets.description} ILIKE ${`%${search}%`})`
    )
  }

  // 排序条件
  let orderBy
  switch (sort) {
    case 'hot':
      orderBy = [desc(couplets.hot), desc(couplets.viewCount)]
      break
    case 'contents':
      // 按内容数量排序，需要子查询
      orderBy = [desc(couplets.createdAt)] // 暂时用创建时间，后续可优化
      break
    case 'latest':
    default:
      orderBy = [desc(couplets.createdAt)]
      break
  }

  // 查询对联列表
  const coupletsData = await db
    .select({
      id: couplets.id,
      title: couplets.title,
      slug: couplets.slug,
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
      language: couplets.language,
      createdAt: couplets.createdAt,
      updatedAt: couplets.updatedAt,
      category: {
        id: coupletCategories.id,
        name: coupletCategories.name,
        slug: coupletCategories.slug,
        icon: coupletCategories.icon,
        color: coupletCategories.color,
      },
      author: {
        id: users.id,
        name: users.name,
        username: users.username,
        email: users.email,
        avatar: users.avatar,
      },
    })
    .from(couplets)
    .leftJoin(coupletCategories, eq(couplets.categoryId, coupletCategories.id))
    .leftJoin(users, eq(couplets.authorId, users.id))
    .where(and(...whereConds))
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset)

  // 获取总数
  const totalCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(couplets)
    .leftJoin(coupletCategories, eq(couplets.categoryId, coupletCategories.id))
    .where(and(...whereConds))

  const totalCount = totalCountResult[0]?.count || 0
  const totalPages = Math.ceil(totalCount / limit)

  // 获取每个对联的内容数量、标签和具体内容
  const coupletIds = coupletsData.map(c => c.id)
  
  // 获取内容数量
  const contentCounts = coupletIds.length > 0 ? await db
    .select({
      coupletId: coupletContents.coupletId,
      count: sql<number>`count(*)`
    })
    .from(coupletContents)
    .innerJoin(coupletVersions, and(
      eq(coupletContents.versionId, coupletVersions.id),
      eq(coupletVersions.isLatestVersion, true)
    ))
    .where(inArray(coupletContents.coupletId, coupletIds))
    .groupBy(coupletContents.coupletId) : []

  // 获取对联具体内容
  const contents = coupletIds.length > 0 ? await db
    .select({
      coupletId: coupletContents.coupletId,
      upperLine: coupletContents.upperLine,
      lowerLine: coupletContents.lowerLine,
      horizontalScroll: coupletContents.horizontalScroll,
      appreciation: coupletContents.appreciation,
      orderIndex: coupletContents.orderIndex,
    })
    .from(coupletContents)
    .innerJoin(coupletVersions, and(
      eq(coupletContents.versionId, coupletVersions.id),
      eq(coupletVersions.isLatestVersion, true)
    ))
    .where(inArray(coupletContents.coupletId, coupletIds))
    .orderBy(coupletContents.orderIndex) : []

  // 获取标签
  const tagRelations = coupletIds.length > 0 ? await db
    .select({
      coupletId: coupletTagRelations.coupletId,
      tagId: coupletTags.id,
      name: coupletTags.name,
      slug: coupletTags.slug,
    })
    .from(coupletTagRelations)
    .leftJoin(coupletTags, eq(coupletTagRelations.tagId, coupletTags.id))
    .where(inArray(coupletTagRelations.coupletId, coupletIds)) : []

  // 组装数据
  const formattedCouplets = coupletsData.map(couplet => {
    const contentCount = contentCounts.find(cc => cc.coupletId === couplet.id)?.count || 0
    const coupletContents = contents.filter(c => c.coupletId === couplet.id)
    const tags = tagRelations
      .filter(tr => tr.coupletId === couplet.id && tr.tagId)
      .map(tr => ({
        id: tr.tagId!,
        name: tr.name || '',
        slug: tr.slug || '',
      }))

    return {
      ...couplet,
      contentCount: contentCount,
      contents: coupletContents,
      tags,
    }
  })

  return {
    success: true,
    data: {
      couplets: formattedCouplets,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  }
}