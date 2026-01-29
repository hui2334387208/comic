import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, and, desc } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { achievements, userAchievements } from '@/db/schema'
import { AchievementSystem } from '@/lib/achievement-system'
import { publicApiRateLimit } from '@/lib/rate-limit'

// GET /api/game/achievements - 获取用户成就信息
export async function GET(request: NextRequest) {
  try {
    const rateLimit = publicApiRateLimit(request)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: '请求过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'

    let result: any = {}

    switch (type) {
      case 'unread':
        // 获取未读成就通知
        result.unreadAchievements = await AchievementSystem.getUnreadAchievements(session.user.id)
        break
      
      case 'stats':
        // 获取成就统计
        result.stats = await AchievementSystem.getUserAchievementStats(session.user.id)
        break
      
      case 'all':
      default:
        // 获取所有成就和用户进度
        const allAchievements = await db
          .select({
            achievement: achievements,
            userAchievement: userAchievements,
          })
          .from(achievements)
          .leftJoin(
            userAchievements, 
            and(
              eq(userAchievements.achievementId, achievements.id),
              eq(userAchievements.userId, session.user.id)
            )
          )
          .where(eq(achievements.isActive, true))
          .orderBy(achievements.orderIndex, achievements.id)

        result.achievements = allAchievements.map(item => ({
          ...item.achievement,
          userProgress: item.userAchievement ? {
            progress: item.userAchievement.progress,
            maxProgress: item.userAchievement.maxProgress,
            isCompleted: item.userAchievement.isCompleted,
            completedAt: item.userAchievement.completedAt,
          } : null
        }))
        break
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('获取成就信息失败:', error)
    return NextResponse.json(
      { success: false, message: '获取成就信息失败' },
      { status: 500 }
    )
  }
}

// POST /api/game/achievements - 标记成就通知为已读
export async function POST(request: NextRequest) {
  try {
    const rateLimit = publicApiRateLimit(request)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: '请求过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      )
    }

    const { action, achievementIds } = await request.json()

    if (action === 'mark_notified' && Array.isArray(achievementIds)) {
      await AchievementSystem.markAchievementsAsNotified(session.user.id, achievementIds)
      
      return NextResponse.json({
        success: true,
        message: '成就通知已标记为已读'
      })
    } else if (action === 'check_achievements') {
      // 手动触发成就检查
      const newAchievements = await AchievementSystem.checkAndGrantAchievements(session.user.id)
      
      return NextResponse.json({
        success: true,
        data: {
          newAchievements: newAchievements.length,
          achievements: newAchievements
        },
        message: newAchievements.length > 0 
          ? `恭喜获得 ${newAchievements.length} 个新成就！`
          : '暂无新成就'
      })
    } else {
      return NextResponse.json(
        { success: false, message: '无效的操作' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('处理成就操作失败:', error)
    return NextResponse.json(
      { success: false, message: '处理成就操作失败' },
      { status: 500 }
    )
  }
}