import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, and } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { comicLikes } from '@/db/schema'
import { publicApiRateLimit } from '@/lib/rate-limit'

// GET /api/comic/[id]/like - 检查漫画点赞状态
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await publicApiRateLimit(request)

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: true, liked: false })
    }

    const { id } = await params
    const comicId = parseInt(id)
    if (isNaN(comicId)) {
      return NextResponse.json({ success: false, message: '无效的漫画ID' }, { status: 400 })
    }

    const like = await db
      .select()
      .from(comicLikes)
      .where(
        and(
          eq(comicLikes.comicId, comicId),
          eq(comicLikes.userId, session.user.id)
        )
      )
      .limit(1)

    return NextResponse.json({
      success: true,
      liked: like.length > 0,
    })
  } catch (error) {
    console.error('检查漫画点赞状态失败:', error)
    return NextResponse.json({ success: false, message: '检查点赞状态失败' }, { status: 500 })
  }
}

// POST /api/comic/[id]/like - 点赞漫画
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
    const comicId = parseInt(id)
    if (isNaN(comicId)) {
      return NextResponse.json({ success: false, message: '无效的漫画ID' }, { status: 400 })
    }

    // 检查是否已经点赞
    const existing = await db
      .select()
      .from(comicLikes)
      .where(
        and(
          eq(comicLikes.comicId, comicId),
          eq(comicLikes.userId, session.user.id)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        liked: true,
        message: '已经点赞过了',
      })
    }

    await db.insert(comicLikes).values({
      comicId,
      userId: session.user.id,
    })

    return NextResponse.json({
      success: true,
      liked: true,
    })
  } catch (error) {
    console.error('点赞漫画失败:', error)
    return NextResponse.json({ success: false, message: '点赞失败' }, { status: 500 })
  }
}

// DELETE /api/comic/[id]/like - 取消点赞漫画
export async function DELETE(
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
    const comicId = parseInt(id)
    if (isNaN(comicId)) {
      return NextResponse.json({ success: false, message: '无效的漫画ID' }, { status: 400 })
    }

    await db
      .delete(comicLikes)
      .where(
        and(
          eq(comicLikes.comicId, comicId),
          eq(comicLikes.userId, session.user.id)
        )
      )

    return NextResponse.json({
      success: true,
      liked: false,
    })
  } catch (error) {
    console.error('取消点赞漫画失败:', error)
    return NextResponse.json({ success: false, message: '取消点赞失败' }, { status: 500 })
  }
}
