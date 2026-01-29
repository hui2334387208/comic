import { eq, and, inArray, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { couplets, coupletCategories, coupletContents, coupletVersions } from '@/db/schema/couplet'
import { users } from '@/db/schema/users'
import { authOptions } from '@/lib/authOptions'

// GET /api/user/couplets - 获取用户创建的对联
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }
    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const offset = (page - 1) * limit

    // 构建查询条件
    let where
    if (status) {
      where = and(eq(couplets.authorId, userId), eq(couplets.status, status))
    } else {
      where = eq(couplets.authorId, userId)
    }

    // 查询总数
    const total = await db.select().from(couplets).where(where)
    
    // 查询分页数据
    const items = await db
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
      .where(where)
      .orderBy(couplets.createdAt)
      .limit(limit)
      .offset(offset)

    // 查询对联内容
    const coupletIds = items.map(item => item.id)
    const contentsMap: Record<number, any> = {}
    
    if (coupletIds.length > 0) {
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
    }

    // 合并对联内容
    const itemsWithContents = items.map(item => ({ 
      ...item, 
      contents: contentsMap[item.id] || null 
    }))

    return NextResponse.json({
      success: true,
      data: {
        couplets: itemsWithContents,
        pagination: {
          page,
          limit,
          total: total.length,
          totalPages: Math.ceil(total.length / limit),
          hasNext: page * limit < total.length,
          hasPrev: page > 1,
        },
      },
    })
  } catch (error) {
    console.error('获取用户对联失败:', error)
    return NextResponse.json(
      { success: false, message: '获取用户对联失败' },
      { status: 500 },
    )
  }
}