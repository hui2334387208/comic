

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface CoupletListServerResult {
  success: boolean
  data: {
    couplets: any[]
    pagination: Pagination
  }
}

export interface CoupletListServerParams {
  page: number
  limit: number
  category?: string | null
  search?: string | null
  sort?: string
  language: string
}

// 从 API 路由导入查询函数
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
  // 这里需要导入 API 路由中的查询逻辑
  const { eq, and, desc, sql, inArray } = await import('drizzle-orm')
  const { db } = await import('@/db')
  const { couplets, coupletCategories, coupletContents, coupletVersions, users, coupletTagRelations, coupletTags } = await import('@/db/schema')

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
      orderBy = [desc(couplets.createdAt)]
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

export async function fetchCoupletListForServer(params: CoupletListServerParams): Promise<CoupletListServerResult> {
  const {
    page,
    limit,
    category = null,
    search = null,
    sort = 'latest',
    language,
  } = params

  try {
    return await fetchCoupletList({ page, limit, category, search, sort, language })
  } catch (error) {
    console.error('Error fetching couplet list for server:', error)
    return {
      success: false,
      data: {
        couplets: [],
        pagination: {
          page,
          limit,
          totalCount: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      },
    }
  }
}