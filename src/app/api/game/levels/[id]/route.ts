import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, and } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { gamificationLevels, userLevelProgress } from '@/db/schema'
import { publicApiRateLimit } from '@/lib/rate-limit'

// GET /api/game/levels/[id] - 获取关卡详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimit = publicApiRateLimit(request)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: '请求过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    const { id } = await params
    const levelId = parseInt(id)

    if (isNaN(levelId)) {
      return NextResponse.json(
        { success: false, message: '无效的关卡ID' },
        { status: 400 }
      )
    }

    const session = await getServerSession(authOptions)

    // 获取关卡信息
    const level = await db
      .select()
      .from(gamificationLevels)
      .where(and(
        eq(gamificationLevels.id, levelId),
        eq(gamificationLevels.isActive, true)
      ))
      .limit(1)

    if (level.length === 0) {
      return NextResponse.json(
        { success: false, message: '关卡不存在' },
        { status: 404 }
      )
    }

    const levelData = level[0]

    // 如果用户已登录，获取用户进度
    let userProgress = null
    let isUnlocked = false

    if (session?.user?.id) {
      const progress = await db
        .select()
        .from(userLevelProgress)
        .where(and(
          eq(userLevelProgress.userId, session.user.id),
          eq(userLevelProgress.levelId, levelId)
        ))
        .limit(1)

      userProgress = progress[0] || null

      // 检查关卡是否解锁
      if (levelData.orderIndex === 1) {
        // 第一关总是解锁的
        isUnlocked = true
      } else if (userProgress) {
        isUnlocked = userProgress.status !== 'locked'
      } else {
        // 检查前一关是否完成
        const prevLevel = await db
          .select()
          .from(gamificationLevels)
          .where(and(
            eq(gamificationLevels.orderIndex, (levelData.orderIndex || 0) - 1),
            eq(gamificationLevels.isActive, true)
          ))
          .limit(1)

        if (prevLevel.length > 0) {
          const prevProgress = await db
            .select()
            .from(userLevelProgress)
            .where(and(
              eq(userLevelProgress.userId, session.user.id),
              eq(userLevelProgress.levelId, prevLevel[0].id),
              eq(userLevelProgress.status, 'completed')
            ))
            .limit(1)

          isUnlocked = prevProgress.length > 0
        }
      }

      // 如果关卡解锁但没有进度记录，创建一个
      if (isUnlocked && !userProgress) {
        await db.insert(userLevelProgress).values({
          userId: session.user.id,
          levelId: levelId,
          status: 'unlocked',
          attempts: 0,
          bestScore: 0,
          totalScore: 0,
        })

        userProgress = {
          id: 0,
          userId: session.user.id,
          levelId: levelId,
          status: 'unlocked' as const,
          attempts: 0,
          bestScore: 0,
          totalScore: 0,
          completedAt: null,
          lastAttemptAt: null,
          timeSpent: 0,
          submissionData: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...levelData,
        userProgress,
        isUnlocked,
      }
    })
  } catch (error) {
    console.error('获取关卡详情失败:', error)
    return NextResponse.json(
      { success: false, message: '获取关卡详情失败' },
      { status: 500 }
    )
  }
}