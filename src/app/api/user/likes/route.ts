import { eq, inArray, and } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { couplets, coupletCategories, coupletLikes, coupletContents, coupletVersions } from '@/db/schema/couplet'
import { users } from '@/db/schema/users'
import { authOptions } from '@/lib/authOptions'

// GET /api/user/likes - 获取用户点赞过的对联
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '10', 10)
  const offset = (page - 1) * limit

  const likeRows = await db
    .select({
      coupletId: coupletLikes.coupletId,
      likedAt: coupletLikes.createdAt,
    })
    .from(coupletLikes)
    .where(eq(coupletLikes.userId, userId))
    .limit(limit)
    .offset(offset)

  const coupletIds = likeRows.map((row) => row.coupletId)

  let likedCouplets: any[] = []
  if (coupletIds.length > 0) {
    likedCouplets = await db
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
        model: couplets.model,
        prompt: couplets.prompt,
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
          username: users.username,
          avatar: users.avatar,
        },
      })
      .from(couplets)
      .leftJoin(coupletCategories, eq(couplets.categoryId, coupletCategories.id))
      .leftJoin(users, eq(couplets.authorId, users.id))
      .where(inArray(couplets.id, coupletIds))

    // 查询对联内容
    const contentsMap: Record<number, any> = {}
    
    // 获取最新版本
    const latestVersions = await db
      .select({ coupletId: coupletVersions.coupletId, versionId: coupletVersions.id })
      .from(coupletVersions)
      .where(and(inArray(coupletVersions.coupletId, coupletIds), eq(coupletVersions.isLatestVersion, true)))
    
    const versionIds = latestVersions.map(row => row.versionId)
    
    if (versionIds.length > 0) {
      // 查询对联内容，使用 try-catch 处理可能不存在的字段
      let contents
      try {
        contents = await db
          .select({
            coupletId: coupletContents.coupletId,
            versionId: coupletContents.versionId,
            upperLine: coupletContents.upperLine,
            lowerLine: coupletContents.lowerLine,
            horizontalScroll: coupletContents.horizontalScroll,
            appreciation: coupletContents.appreciation,
          })
          .from(coupletContents)
          .where(inArray(coupletContents.versionId, versionIds))
      } catch (error) {
        // 如果 appreciation 字段不存在，回退到基础查询
        console.warn('查询包含appreciation字段失败，回退到基础查询:', error)
        contents = await db
          .select({
            coupletId: coupletContents.coupletId,
            versionId: coupletContents.versionId,
            upperLine: coupletContents.upperLine,
            lowerLine: coupletContents.lowerLine,
            horizontalScroll: coupletContents.horizontalScroll,
          })
          .from(coupletContents)
          .where(inArray(coupletContents.versionId, versionIds))
          .then(results => results.map(r => ({ ...r, appreciation: null })))
      }
      
      // 构建内容映射
      for (const content of contents) {
        contentsMap[content.coupletId] = {
          firstLine: content.upperLine,
          secondLine: content.lowerLine,
          horizontalScroll: content.horizontalScroll,
          appreciation: content.appreciation,
        }
      }
    }

    // 添加对联内容
    likedCouplets = likedCouplets.map(couplet => ({
      ...couplet,
      contents: contentsMap[couplet.id] || null
    }))
  }

  const likes = likedCouplets.map((couplet) => {
    const like = likeRows.find((row) => row.coupletId === couplet.id)
    return { ...couplet, likedAt: like?.likedAt }
  })

  return NextResponse.json({
    success: true,
    data: {
      likes,
      pagination: {
        page,
        limit,
        total: likeRows.length,
        totalPages: Math.ceil(likeRows.length / limit),
        hasNext: page * limit < likeRows.length,
        hasPrev: page > 1,
      },
    },
  })
}

