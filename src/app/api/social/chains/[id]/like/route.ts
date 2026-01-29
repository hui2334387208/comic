import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { coupletChainLikes, coupletChainEntries } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// 点赞接龙条目
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      )
    }

    const { id } = await params
    const chainId = parseInt(id)
    const userId = session.user.id
    const body = await request.json()
    const { entryId } = body

    // 检查是否已经点赞
    const existingLike = await db
      .select()
      .from(coupletChainLikes)
      .where(and(
        eq(coupletChainLikes.entryId, entryId),
        eq(coupletChainLikes.userId, userId)
      ))
      .limit(1)

    if (existingLike.length > 0) {
      // 取消点赞
      await db
        .delete(coupletChainLikes)
        .where(eq(coupletChainLikes.id, existingLike[0].id))

      // 更新点赞数
      const entry = await db
        .select()
        .from(coupletChainEntries)
        .where(eq(coupletChainEntries.id, entryId))
        .limit(1)

      if (entry.length > 0) {
        await db
          .update(coupletChainEntries)
          .set({
            likeCount: Math.max(0, (entry[0].likeCount || 0) - 1)
          })
          .where(eq(coupletChainEntries.id, entryId))
      }

      return NextResponse.json({
        success: true,
        message: '取消点赞成功',
        liked: false
      })
    } else {
      // 添加点赞
      await db.insert(coupletChainLikes).values({
        entryId,
        userId
      })

      // 更新点赞数
      const entry = await db
        .select()
        .from(coupletChainEntries)
        .where(eq(coupletChainEntries.id, entryId))
        .limit(1)

      if (entry.length > 0) {
        await db
          .update(coupletChainEntries)
          .set({
            likeCount: (entry[0].likeCount || 0) + 1
          })
          .where(eq(coupletChainEntries.id, entryId))
      }

      return NextResponse.json({
        success: true,
        message: '点赞成功',
        liked: true
      })
    }

  } catch (error) {
    console.error('点赞操作失败:', error)
    return NextResponse.json(
      { success: false, message: '点赞操作失败' },
      { status: 500 }
    )
  }
}