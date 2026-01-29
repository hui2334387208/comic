import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, and } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { coupletFavorites } from '@/db/schema'
import { publicApiRateLimit } from '@/lib/rate-limit'

// GET /api/couplet/[id]/favorite - 检查对联收藏状态
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
    const coupletId = parseInt(id)
    if (isNaN(coupletId)) {
      return NextResponse.json({ success: false, message: '无效的对联ID' }, { status: 400 })
    }

    const favorite = await db
      .select()
      .from(coupletFavorites)
      .where(
        and(
          eq(coupletFavorites.coupletId, coupletId),
          eq(coupletFavorites.userId, session.user.id)
        )
      )
      .limit(1)

    return NextResponse.json({
      success: true,
      favorited: favorite.length > 0,
    })
  } catch (error) {
    console.error('检查对联收藏状态失败:', error)
    return NextResponse.json({ success: false, message: '检查收藏状态失败' }, { status: 500 })
  }
}

// POST /api/couplet/[id]/favorite - 收藏对联
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

    // 检查是否已经收藏
    const existing = await db
      .select()
      .from(coupletFavorites)
      .where(
        and(
          eq(coupletFavorites.coupletId, coupletId),
          eq(coupletFavorites.userId, session.user.id)
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

    await db.insert(coupletFavorites).values({
      coupletId,
      userId: session.user.id,
    })

    return NextResponse.json({
      success: true,
      favorited: true,
    })
  } catch (error) {
    console.error('收藏对联失败:', error)
    return NextResponse.json({ success: false, message: '收藏失败' }, { status: 500 })
  }
}

// DELETE /api/couplet/[id]/favorite - 取消收藏对联
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
    const coupletId = parseInt(id)
    if (isNaN(coupletId)) {
      return NextResponse.json({ success: false, message: '无效的对联ID' }, { status: 400 })
    }

    await db
      .delete(coupletFavorites)
      .where(
        and(
          eq(coupletFavorites.coupletId, coupletId),
          eq(coupletFavorites.userId, session.user.id)
        )
      )

    return NextResponse.json({
      success: true,
      favorited: false,
    })
  } catch (error) {
    console.error('取消收藏对联失败:', error)
    return NextResponse.json({ success: false, message: '取消收藏失败' }, { status: 500 })
  }
}