import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { comicComments, users } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

// GET - 获取评论列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comicId = parseInt(params.id)

    if (isNaN(comicId)) {
      return NextResponse.json(
        { success: false, message: '无效的漫画ID' },
        { status: 400 }
      )
    }

    // 获取评论列表，关联用户信息
    const commentsList = await db
      .select({
        id: comicComments.id,
        content: comicComments.content,
        createdAt: comicComments.createdAt,
        updatedAt: comicComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          username: users.username,
          avatar: users.avatar,
        },
      })
      .from(comicComments)
      .leftJoin(users, eq(comicComments.userId, users.id))
      .where(eq(comicComments.comicId, comicId))
      .orderBy(desc(comicComments.createdAt))

    return NextResponse.json({
      success: true,
      data: {
        comments: commentsList,
      },
    })
  } catch (error) {
    console.error('获取评论失败:', error)
    return NextResponse.json(
      { success: false, message: '获取评论失败' },
      { status: 500 }
    )
  }
}

// POST - 发表评论
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '未登录' },
        { status: 401 }
      )
    }

    const comicId = parseInt(params.id)

    if (isNaN(comicId)) {
      return NextResponse.json(
        { success: false, message: '无效的漫画ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, message: '评论内容不能为空' },
        { status: 400 }
      )
    }

    // 插入评论
    const [newComment] = await db
      .insert(comicComments)
      .values({
        comicId,
        userId: session.user.id,
        content: content.trim(),
      })
      .returning()

    // 获取用户信息
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        avatar: users.avatar,
      })
      .from(users)
      .where(eq(users.id, session.user.id))

    return NextResponse.json({
      success: true,
      data: {
        ...newComment,
        user,
      },
    })
  } catch (error) {
    console.error('发表评论失败:', error)
    return NextResponse.json(
      { success: false, message: '发表评论失败' },
      { status: 500 }
    )
  }
}
