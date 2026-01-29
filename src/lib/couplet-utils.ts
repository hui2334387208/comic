import { eq, desc, and } from 'drizzle-orm'
import { db } from '@/db'
import { couplets, coupletContents, coupletCategories, users, coupletVersions, coupletTagRelations, coupletTags } from '@/db/schema'

// 获取对联详情的工具函数
export async function fetchCoupletDetail(id: number, versionId: string | null) {
  // 确定要查询的版本ID
  let targetVersionId: number

  if (versionId) {
    // 如果传入了versionId，使用指定的版本
    targetVersionId = parseInt(versionId)
  } else {
    // 如果没有传入versionId，查询最新版本
    const latestVersion = await db
      .select({ id: coupletVersions.id })
      .from(coupletVersions)
      .where(and(eq(coupletVersions.coupletId, id), eq(coupletVersions.isLatestVersion, true)))
      .limit(1)

    if (latestVersion.length === 0) {
      return {
        success: false,
        message: '对联版本不存在',
      }
    }

    targetVersionId = latestVersion[0].id
  }

  // 获取对联基本信息
  const coupletData = await db
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
      model: couplets.model,
      prompt: couplets.prompt,
    })
    .from(couplets)
    .leftJoin(coupletCategories, eq(couplets.categoryId, coupletCategories.id))
    .leftJoin(users, eq(couplets.authorId, users.id))
    .where(eq(couplets.id, id))
    .limit(1)

  if (coupletData.length === 0) {
    return {
      success: false,
      message: '对联不存在',
    }
  }

  const couplet = coupletData[0]

  // 获取对联标签
  const tagRelationsRaw = await db.select({
    tagId: coupletTags.id,
    name: coupletTags.name,
    slug: coupletTags.slug,
  })
    .from(coupletTagRelations)
    .leftJoin(coupletTags, eq(coupletTagRelations.tagId, coupletTags.id))
    .where(eq(coupletTagRelations.coupletId, id))

  // 对标签去重（按tagId）
  const tagSet = new Set()
  const tagRelations = []
  for (const tr of tagRelationsRaw) {
    if (tr.tagId && !tagSet.has(tr.tagId)) {
      tagSet.add(tr.tagId)
      tagRelations.push(tr)
    }
  }

  // 获取对联内容（上联、下联、横批、赏析）
  const contents = await db
    .select({
      id: coupletContents.id,
      upperLine: coupletContents.upperLine,
      lowerLine: coupletContents.lowerLine,
      horizontalScroll: coupletContents.horizontalScroll,
      appreciation: coupletContents.appreciation,
      orderIndex: coupletContents.orderIndex,
      createdAt: coupletContents.createdAt,
    })
    .from(coupletContents)
    .where(and(eq(coupletContents.coupletId, id), eq(coupletContents.versionId, targetVersionId)))
    .orderBy(coupletContents.orderIndex)
    .catch(async (error) => {
      // 如果查询失败（可能是因为appreciation字段不存在），回退到不包含appreciation的查询
      console.warn('查询包含appreciation字段失败，回退到基础查询:', error.message)
      return await db
        .select({
          id: coupletContents.id,
          upperLine: coupletContents.upperLine,
          lowerLine: coupletContents.lowerLine,
          horizontalScroll: coupletContents.horizontalScroll,
          orderIndex: coupletContents.orderIndex,
          createdAt: coupletContents.createdAt,
        })
        .from(coupletContents)
        .where(and(eq(coupletContents.coupletId, id), eq(coupletContents.versionId, targetVersionId)))
        .orderBy(coupletContents.orderIndex)
        .then(results => results.map(r => ({ ...r, appreciation: null })))
    })

  // 格式化响应数据
  const formattedContents = contents.map((content: any, index: number) => ({
    id: content.id,
    upperLine: content.upperLine || '',
    lowerLine: content.lowerLine || '',
    horizontalScroll: content.horizontalScroll || '',
    appreciation: content.appreciation || '',
    orderIndex: content.orderIndex,
  }))

  // 格式化响应数据
  const responseData = {
    id: couplet.id,
    title: couplet.title,
    slug: couplet.slug,
    description: couplet.description,
    category: couplet.category,
    author: couplet.author,
    status: couplet.status,
    isPublic: couplet.isPublic,
    viewCount: couplet.viewCount,
    likeCount: couplet.likeCount,
    createdAt: couplet.createdAt,
    updatedAt: couplet.updatedAt,
    prompt: couplet.prompt,
    tags: tagRelations.map(tr => ({
      id: tr.tagId ?? 0,
      name: tr.name ?? '',
      slug: tr.slug ?? '',
    })),
    contents: formattedContents,
    model: couplet.model,
  }

  return {
    success: true,
    data: responseData,
  }
}

// 获取对联版本列表的工具函数
export async function fetchCoupletVersions(coupletId: number) {
  // 检查对联是否存在
  const coupletExists = await db
    .select({ id: couplets.id })
    .from(couplets)
    .where(eq(couplets.id, coupletId))
    .limit(1)

  if (coupletExists.length === 0) {
    return null
  }

  // 获取所有版本
  const versions = await db
    .select({
      id: coupletVersions.id,
      coupletId: coupletVersions.coupletId,
      version: coupletVersions.version,
      parentVersionId: coupletVersions.parentVersionId,
      versionDescription: coupletVersions.versionDescription,
      isLatestVersion: coupletVersions.isLatestVersion,
      originalCoupletId: coupletVersions.originalCoupletId,
      createdAt: coupletVersions.createdAt,
      updatedAt: coupletVersions.updatedAt,
    })
    .from(coupletVersions)
    .where(eq(coupletVersions.coupletId, coupletId))
    .orderBy(desc(coupletVersions.version))

  // 获取每个版本的内容数量
  const versionsWithCount = await Promise.all(
    versions.map(async (version) => {
      const contents = await db
        .select({ id: coupletContents.id })
        .from(coupletContents)
        .where(eq(coupletContents.versionId, version.id))

      return {
        ...version,
        eventCount: contents.length,
      }
    })
  )

  return {
    success: true,
    data: {
      coupletId,
      versions: versionsWithCount,
    },
  }
}