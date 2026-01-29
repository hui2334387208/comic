import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, and, desc } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { dailySignins, userPointsSummary, userPoints } from '@/db/schema'
import { publicApiRateLimit } from '@/lib/rate-limit'

// 积分配置
const SIGNIN_BASE_POINTS = 10
const STREAK_MULTIPLIERS = {
  7: 2,   // 7天连续签到 2倍积分
  14: 3,  // 14天连续签到 3倍积分
  30: 5,  // 30天连续签到 5倍积分
  100: 10 // 100天连续签到 10倍积分
}

// 等级配置
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000, 50000
]

function calculateLevel(totalPoints: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_THRESHOLDS[i]) {
      return i + 1
    }
  }
  return 1
}

function calculateLevelProgress(totalPoints: number): number {
  const level = calculateLevel(totalPoints)
  if (level >= LEVEL_THRESHOLDS.length) return 100
  
  const currentThreshold = LEVEL_THRESHOLDS[level - 1]
  const nextThreshold = LEVEL_THRESHOLDS[level]
  
  return Math.floor(((totalPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
}

function getNextLevelThreshold(totalPoints: number): number {
  const level = calculateLevel(totalPoints)
  if (level >= LEVEL_THRESHOLDS.length) return 0
  
  return LEVEL_THRESHOLDS[level] - totalPoints
}

// GET /api/game/signin - 获取签到状态
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
    const today = new Date().toISOString().split('T')[0]
    
    // 检查今日签到状态
    const todaySignin = await db
      .select()
      .from(dailySignins)
      .where(and(
        eq(dailySignins.userId, userId),
        eq(dailySignins.signinDate, today)
      ))
      .limit(1)

    // 获取用户积分汇总
    const summary = await db
      .select()
      .from(userPointsSummary)
      .where(eq(userPointsSummary.userId, userId))
      .limit(1)

    // 获取签到历史（最近30天）
    const signinHistory = await db
      .select()
      .from(dailySignins)
      .where(eq(dailySignins.userId, userId))
      .orderBy(desc(dailySignins.signinDate))
      .limit(30)

    const currentSummary = summary[0] || {
      totalPoints: 0,
      availablePoints: 0,
      streak: 0,
      longestStreak: 0,
      lastSigninAt: null
    }

    return NextResponse.json({
      success: true,
      data: {
        hasSignedToday: todaySignin.length > 0,
        todaySignin: todaySignin[0] || null,
        streak: currentSummary.streak,
        longestStreak: currentSummary.longestStreak,
        totalPoints: currentSummary.totalPoints,
        level: calculateLevel(currentSummary.totalPoints || 0),
        signinHistory: signinHistory.map(signin => ({
          date: signin.signinDate,
          points: signin.points,
          streak: signin.streak,
          bonusPoints: signin.bonusPoints,
          bonusReason: signin.bonusReason,
          createdAt: signin.createdAt
        }))
      }
    })
  } catch (error) {
    console.error('获取签到状态失败:', error)
    return NextResponse.json(
      { success: false, message: '获取签到状态失败' },
      { status: 500 }
    )
  }
}

// POST /api/game/signin - 每日签到
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

    const userId = session.user.id
    const today = new Date().toISOString().split('T')[0]
    
    // 检查今天是否已签到
    const existingSignin = await db
      .select()
      .from(dailySignins)
      .where(and(
        eq(dailySignins.userId, userId),
        eq(dailySignins.signinDate, today)
      ))
      .limit(1)

    if (existingSignin.length > 0) {
      return NextResponse.json(
        { success: false, message: '今天已经签到过了' },
        { status: 400 }
      )
    }

    // 获取用户积分汇总
    let summary = await db
      .select()
      .from(userPointsSummary)
      .where(eq(userPointsSummary.userId, userId))
      .limit(1)

    if (summary.length === 0) {
      // 创建新的积分汇总
      await db.insert(userPointsSummary).values({
        userId,
        totalPoints: 0,
        availablePoints: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
      })
      summary = await db
        .select()
        .from(userPointsSummary)
        .where(eq(userPointsSummary.userId, userId))
        .limit(1)
    }

    const currentSummary = summary[0]
    
    // 计算连续签到天数
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    let newStreak = 1
    if (currentSummary.lastSigninAt === yesterdayStr) {
      newStreak = (currentSummary.streak || 0) + 1
    }

    // 计算积分（包含连续签到奖励）
    let basePoints = SIGNIN_BASE_POINTS
    let bonusPoints = 0
    let bonusReason = ''

    // 检查连续签到奖励
    for (const [days, multiplier] of Object.entries(STREAK_MULTIPLIERS)) {
      if (newStreak >= parseInt(days)) {
        bonusPoints = basePoints * (multiplier - 1)
        bonusReason = `连续签到${days}天奖励`
      }
    }

    const totalPoints = basePoints + bonusPoints
    const newTotalPoints = (currentSummary.totalPoints || 0) + totalPoints

    await db.transaction(async (tx) => {
      // 记录签到
      await tx.insert(dailySignins).values({
        userId,
        signinDate: today,
        points: basePoints,
        streak: newStreak,
        bonusPoints,
        bonusReason,
      })

      // 更新积分汇总
      await tx
        .update(userPointsSummary)
        .set({
          totalPoints: newTotalPoints,
          availablePoints: (currentSummary.availablePoints || 0) + totalPoints,
          streak: newStreak,
          longestStreak: Math.max(currentSummary.longestStreak || 0, newStreak),
          lastSigninAt: today,
          level: calculateLevel(newTotalPoints),
          levelProgress: calculateLevelProgress(newTotalPoints),
          nextLevelPoints: getNextLevelThreshold(newTotalPoints),
          updatedAt: new Date(),
        })
        .where(eq(userPointsSummary.userId, userId))

      // 添加积分记录
      await tx.insert(userPoints).values({
        userId,
        pointType: 'daily_signin',
        points: totalPoints,
        source: 'daily_signin',
        description: bonusReason ? `每日签到+${bonusReason}` : '每日签到',
      })
    })

    return NextResponse.json({
      success: true,
      data: {
        points: totalPoints,
        basePoints,
        bonusPoints,
        bonusReason,
        streak: newStreak,
        newLevel: calculateLevel(newTotalPoints),
        totalPoints: newTotalPoints
      },
      message: bonusReason 
        ? `签到成功！获得${totalPoints}积分（${bonusReason}）`
        : `签到成功！获得${totalPoints}积分，连续签到${newStreak}天`
    })
  } catch (error: any) {
    console.error('每日签到失败:', error)
    
    return NextResponse.json(
      { success: false, message: '签到失败，请稍后重试' },
      { status: 500 }
    )
  }
}