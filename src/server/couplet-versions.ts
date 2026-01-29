import { eq, desc, sql } from 'drizzle-orm'

import { db } from '@/db'
import { couplets, coupletVersions, coupletContents, coupletCategories, users } from '@/db/schema'

export interface CoupletVersionsResult {
  success: boolean
  data: {
    couplet: any
    versions: any[]
    currentVersion: any | null
  }
}

// 提取实际查询逻辑到 server 模块，供接口与其他服务端逻辑复用
export async function fetchCoupletVersions(coupletId: number): Promise<CoupletVersionsResult | null> {
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
    .where(eq(couplets.id, coupletId))
    .limit(1)

  if (coupletData.length === 0) {
    // 不在这里构造 Response，由调用方决定返回 404 还是其他
    return null
  }

  const couplet = coupletData[0]

  // 获取该对联的所有版本
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
  const versionContents = await db
    .select({
      versionId: coupletContents.versionId,
      contentCount: sql`COUNT(*)`.as('contentCount'),
    })
    .from(coupletContents)
    .where(eq(coupletContents.coupletId, coupletId))
    .groupBy(coupletContents.versionId)

  const contentCountMap = new Map<number, number>()
  versionContents.forEach(item => {
    contentCountMap.set(item.versionId, Number(item.contentCount))
  })

  // 格式化版本数据
  const formattedVersions = versions.map(version => ({
    id: version.id,
    coupletId: version.coupletId, // 对联ID
    version: version.version,
    parentVersionId: version.parentVersionId,
    versionDescription: version.versionDescription,
    isLatestVersion: version.isLatestVersion,
    originalCoupletId: version.originalCoupletId, // 原始对联ID
    eventCount: contentCountMap.get(version.id) || 0,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
  }))

  return {
    success: true,
    data: {
      couplet,
      versions: formattedVersions,
      currentVersion: formattedVersions.find(v => v.isLatestVersion) || formattedVersions[0] || null,
    },
  }
}

export async function fetchCoupletVersionsForServer(id: number) {
  try {
    const result = await fetchCoupletVersions(id)

    if (!result) {
      return {
        success: false,
        data: {
          couplet: null,
          versions: [],
          currentVersion: null,
        },
      }
    }

    return result
  } catch (error) {
    console.error('Error fetching couplet versions for server:', error)
    return {
      success: false,
      data: {
        couplet: null,
        versions: [],
        currentVersion: null,
      },
    }
  }
}

