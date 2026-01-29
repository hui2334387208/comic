import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, desc } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { coupletComments, users } from '@/db/schema'
import { publicApiRateLimit } from '@/lib/rate-limit'

// GET /api/couplet/[id]/comments - 获取对联评论列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await publicApiRateLimit(request)

    const { id } = await params
    const coupletId = parseInt(id)
    if (isNaN(coupletId)) {
      return NextResponse.json({ success: false, message: '无效的对联ID' }, { status: 400 })
    }

    const comments = await db
      .select({
        id: coupletComments.id,
        content: coupletComments.content,
        createdAt: coupletComments.createdAt,
        updatedAt: coupletComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          username: users.username,
          avatar: users.avatar,
        },
      })
      .from(coupletComments)
      .leftJoin(users, eq(coupletComments.userId, users.id))
      .where(eq(coupletComments.coupletId, coupletId))
      .orderBy(desc(coupletComments.createdAt))

    return NextResponse.json({
      success: true,
      data: { comments },
    })
  } catch (error) {
    console.error('获取对联评论失败:', error)
    return NextResponse.json({ success: false, message: '获取评论失败' }, { status: 500 })
  }
}

// POST /api/couplet/[id]/comments - 发表对联评论
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await publicApiRateLimit(request)

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }

    const { id } = await params
    const coupletId = parseInt(id)
    if (isNaN(coupletId)) {
      return NextResponse.json({ success: false, message: '无效的对联ID' }, { status: 400 })
    }

    const { content } = await request.json()
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ success: false, message: '评论内容不能为空' }, { status: 400 })
    }

    if (content.trim().length > 500) {
      return NextResponse.json({ success: false, message: '评论内容不能超过500字符' }, { status: 400 })
    }

    const [newComment] = await db
      .insert(coupletComments)
      .values({
        coupletId,
        userId: session.user.id,
        content: content.trim(),
      })
      .returning()

    const commentWithUser = await db
      .select({
        id: coupletComments.id,
        content: coupletComments.content,
        createdAt: coupletComments.createdAt,
        updatedAt: coupletComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          username: users.username,
          avatar: users.avatar,
        },
      })
      .from(coupletComments)
      .leftJoin(users, eq(coupletComments.userId, users.id))
      .where(eq(coupletComments.id, newComment.id))
      .limit(1)

    return NextResponse.json({
      success: true,
      data: commentWithUser[0],
    })
  } catch (error) {
    console.error('发表对联评论失败:', error)
    return NextResponse.json({ success: false, message: '发表评论失败' }, { status: 500 })
  }
}