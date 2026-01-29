import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, desc, count, sum, and } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { 
  userPointsSummary, 
  userLevelProgress, 
  gamificationLevels,
  userAchievements,
  achievements,
  userBadges,
  badges,
  dailySignins,
  timedChallenges,
  challengeParticipations
} from '@/db/schema'
import { publicApiRateLimit } from '@/lib/rate-limit'

// GET /api/game - 获取用户游戏数据总览
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

    const userId = session.user.id

    // 获取用户积分汇总
    const pointsSummary = await db
      .select()
      .from(userPointsSummary)
      .where(eq(userPointsSummary.userId, userId))
      .limit(1)

    // 获取关卡进度统计
    const levelStats = await db
      .select({
        total: count(),
        completed: count(userLevelProgress.id),
      })
      .from(gamificationLevels)
      .leftJoin(
        userLevelProgress, 
        and(
          eq(userLevelProgress.levelId, gamificationLevels.id),
          eq(userLevelProgress.userId, userId),
          eq(userLevelProgress.status, 'completed')
        )
      )
      .where(eq(gamificationLevels.isActive, true))

    // 获取总关卡数
    const totalLevelsResult = await db
      .select({ count: count() })
      .from(gamificationLevels)
      .where(eq(gamificationLevels.isActive, true))

    // 获取已完成关卡数
    const completedLevelsResult = await db
      .select({ count: count() })
      .from(userLevelProgress)
      .where(and(
        eq(userLevelProgress.userId, userId),
        eq(userLevelProgress.status, 'completed')
      ))

    // 获取活跃挑战数
    const activeChallengesResult = await db
      .select({ count: count() })
      .from(timedChallenges)
      .where(eq(timedChallenges.status, 'active'))

    // 获取用户在活跃挑战中的参与数
    const userActiveChallengesResult = await db
      .select({ count: count() })
      .from(challengeParticipations)
      .innerJoin(timedChallenges, eq(challengeParticipations.challengeId, timedChallenges.id))
      .where(and(
        eq(challengeParticipations.userId, userId),
        eq(timedChallenges.status, 'active')
      ))

    // 获取用户成就数量
    const achievementsResult = await db
      .select({ count: count() })
      .from(userAchievements)
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.isCompleted, true)
      ))

    // 获取用户徽章数量
    const badgesResult = await db
      .select({ count: count() })
      .from(userBadges)
      .where(eq(userBadges.userId, userId))

    // 检查今日签到状态
    const today = new Date().toISOString().split('T')[0]
    const todaySignin = await db
      .select()
      .from(dailySignins)
      .where(and(
        eq(dailySignins.userId, userId),
        eq(dailySignins.signinDate, today)
      ))
      .limit(1)

    // 获取最近成就（最新3个）
    const recentAchievements = await db
      .select({
        achievement: achievements,
        userAchievement: userAchievements,
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.isCompleted, true)
      ))
      .orderBy(desc(userAchievements.completedAt))
      .limit(3)

    // 获取最近徽章（最新3个）
    const recentBadges = await db
      .select({
        badge: badges,
        userBadge: userBadges,
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt))
      .limit(3)

    const summary = pointsSummary[0] || {
      totalPoints: 0,
      availablePoints: 0,
      level: 1,
      levelProgress: 0,
      nextLevelPoints: 100,
      streak: 0,
      longestStreak: 0,
      lastSigninAt: null
    }

    const gameData = {
      summary,
      stats: {
        totalLevels: totalLevelsResult[0]?.count || 0,
        completedLevels: completedLevelsResult[0]?.count || 0,
        activeChallenges: activeChallengesResult[0]?.count || 0,
        userActiveChallenges: userActiveChallengesResult[0]?.count || 0,
        achievements: achievementsResult[0]?.count || 0,
        badges: badgesResult[0]?.count || 0,
        hasSignedToday: todaySignin.length > 0,
      },
      recentAchievements,
      recentBadges,
    }

    return NextResponse.json({
      success: true,
      data: gameData
    })
  } catch (error) {
    console.error('获取游戏数据失败:', error)
    return NextResponse.json(
      { success: false, message: '获取游戏数据失败' },
      { status: 500 }
    )
  }
}