import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, and } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { comicFavorites } from '@/db/schema'
import { publicApiRateLimit } from '@/lib/rate-limit'

// GET /api/comic/[id]/favorite - 检查漫画收藏状态
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await publicApiRateLimit(request)

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: true, favorited: false })
    }

    const { id } = await params
    const comicId = parseInt(id)
    if (isNaN(comicId)) {
      return NextResponse.json({ success: false, message: '无效的漫画ID' }, { status: 400 })
    }

    const favorite = await db
      .select()
      .from(comicFavorites)
      .where(
        and(
          eq(comicFavorites.comicId, comicId),
          eq(comicFavorites.userId, session.user.id)
        )
      )
      .limit(1)

    return NextResponse.json({
      success: true,
      favorited: favorite.length > 0,
    })
  } catch (error) {
    console.error('检查漫画收藏状态失败:', error)
    return NextResponse.json({ success: false, message: '检查收藏状态失败' }, { status: 500 })
  }
}

// POST /api/comic/[id]/favorite - 收藏漫画
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

    // 检查是否已经收藏
    const existing = await db
      .select()
      .from(comicFavorites)
      .where(
        and(
          eq(comicFavorites.comicId, comicId),
          eq(comicFavorites.userId, session.user.id)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        favorited: true,
        message: '已经收藏过了',
      })
    }

    await db.insert(comicFavorites).values({
      comicId,
      userId: session.user.id,
    })

    return NextResponse.json({
      success: true,
      favorited: true,
    })
  } catch (error) {
    console.error('收藏漫画失败:', error)
    return NextResponse.json({ success: false, message: '收藏失败' }, { status: 500 })
  }
}

// DELETE /api/comic/[id]/favorite - 取消收藏漫画
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
      .delete(comicFavorites)
      .where(
        and(
          eq(comicFavorites.comicId, comicId),
          eq(comicFavorites.userId, session.user.id)
        )
      )

    return NextResponse.json({
      success: true,
      favorited: false,
    })
  } catch (error) {
    console.error('取消收藏漫画失败:', error)
    return NextResponse.json({ success: false, message: '取消收藏失败' }, { status: 500 })
  }
}
