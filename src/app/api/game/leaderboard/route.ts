import { NextRequest, NextResponse } from 'next/server'
import { eq, desc, asc, and, gte, lte, count, sum } from 'drizzle-orm'

import { db } from '@/db'
import { 
  leaderboards, 
  leaderboardEntries, 
  userPointsSummary,
  userLevelProgress,
  userPoints,
  users,
  couplets,
  coupletLikes
} from '@/db/schema'
import { publicApiRateLimit } from '@/lib/rate-limit'

// GET /api/game/leaderboard - 获取排行榜数据
export async function GET(request: NextRequest) {
  try {
    const rateLimit = publicApiRateLimit(request)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: '请求过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'points'
    const period = searchParams.get('period') || 'all_time'
    const limit = parseInt(searchParams.get('limit') || '50')

    // 计算时间范围
    const now = new Date()
    let periodStart: Date
    let periodEnd: Date = now

    switch (period) {
      case 'daily':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'weekly':
        const dayOfWeek = now.getDay()
        periodStart = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000)
        periodStart.setHours(0, 0, 0, 0)
        break
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'all_time':
      default:
        periodStart = new Date(0)
        break
    }

    let leaderboardData: any[] = []

    // 根据排行榜类型构建查询
    switch (type) {
      case 'points':
        // 积分排行榜
        if (period === 'all_time') {
          leaderboardData = await db
            .select({
              userId: userPointsSummary.userId,
              score: userPointsSummary.totalPoints,
              user: {
                id: users.id,
                name: users.name,
                username: users.username,
                avatar: users.avatar,
              }
            })
            .from(userPointsSummary)
            .innerJoin(users, eq(userPointsSummary.userId, users.id))
            .orderBy(desc(userPointsSummary.totalPoints))
            .limit(limit)
        } else {
          // 按时间段统计积分
          leaderboardData = await db
            .select({
              userId: userPoints.userId,
              score: sum(userPoints.points),
              user: {
                id: users.id,
                name: users.name,
                username: users.username,
                avatar: users.avatar,
              }
            })
            .from(userPoints)
            .innerJoin(users, eq(userPoints.userId, users.id))
            .where(and(
              gte(userPoints.createdAt, periodStart),
              lte(userPoints.createdAt, periodEnd)
            ))
            .groupBy(userPoints.userId, users.id, users.name, users.username, users.avatar)
            .orderBy(desc(sum(userPoints.points)))
            .limit(limit)
        }
        break

      case 'level_completion':
        // 闯关排行榜
        const whereConditions = [eq(userLevelProgress.status, 'completed')]
        if (period !== 'all_time') {
          whereConditions.push(
            gte(userLevelProgress.completedAt, periodStart),
            lte(userLevelProgress.completedAt, periodEnd)
          )
        }
        
        leaderboardData = await db
          .select({
            userId: userLevelProgress.userId,
            score: count(userLevelProgress.id),
            user: {
              id: users.id,
              name: users.name,
              username: users.username,
              avatar: users.avatar,
            }
          })
          .from(userLevelProgress)
          .innerJoin(users, eq(userLevelProgress.userId, users.id))
          .where(and(...whereConditions))
          .groupBy(userLevelProgress.userId, users.id, users.name, users.username, users.avatar)
          .orderBy(desc(count(userLevelProgress.id)))
          .limit(limit)
        break

      case 'creation_quality':
        // 创作质量排行榜（基于对联获得的点赞数）
        const creationWhereConditions = []
        if (period !== 'all_time') {
          creationWhereConditions.push(
            gte(couplets.createdAt, periodStart),
            lte(couplets.createdAt, periodEnd)
          )
        }
        
        leaderboardData = await db
          .select({
            userId: couplets.authorId,
            score: sum(couplets.likeCount),
            user: {
              id: users.id,
              name: users.name,
              username: users.username,
              avatar: users.avatar,
            }
          })
          .from(couplets)
          .innerJoin(users, eq(couplets.authorId, users.id))
          .where(creationWhereConditions.length > 0 ? and(...creationWhereConditions) : undefined)
          .groupBy(couplets.authorId, users.id, users.name, users.username, users.avatar)
          .orderBy(desc(sum(couplets.likeCount)))
          .limit(limit)
        break

      case 'activity':
        // 活跃度排行榜（基于用户活跃度积分获取）
        leaderboardData = await db
          .select({
            userId: userPoints.userId,
            score: sum(userPoints.points),
            user: {
              id: users.id,
              name: users.name,
              username: users.username,
              avatar: users.avatar,
            }
          })
          .from(userPoints)
          .innerJoin(users, eq(userPoints.userId, users.id))
          .where(and(
            gte(userPoints.createdAt, periodStart),
            lte(userPoints.createdAt, periodEnd)
          ))
          .groupBy(userPoints.userId, users.id, users.name, users.username, users.avatar)
          .orderBy(desc(sum(userPoints.points)))
          .limit(limit)
        break

      default:
        return NextResponse.json(
          { success: false, message: '不支持的排行榜类型' },
          { status: 400 }
        )
    }

    // 添加排名和变化信息
    const entries = leaderboardData.map((entry, index) => ({
      rank: index + 1,
      score: Number(entry.score) || 0,
      user: entry.user,
      change: 0, // TODO: 实现排名变化计算
      previousRank: null,
    }))

    return NextResponse.json({
      success: true,
      data: {
        type,
        period,
        entries,
        total: entries.length,
        lastUpdated: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('获取排行榜数据失败:', error)
    return NextResponse.json(
      { success: false, message: '获取排行榜数据失败' },
      { status: 500 }
    )
  }
}

// POST /api/game/leaderboard/refresh - 刷新排行榜（管理员功能）
export async function POST(request: NextRequest) {
  try {
    // TODO: 添加管理员权限检查
    
    const body = await request.json()
    const { type, period } = body

    if (!type || !period) {
      return NextResponse.json(
        { success: false, message: '请指定排行榜类型和时间周期' },
        { status: 400 }
      )
    }

    // 这里可以实现排行榜数据的预计算和缓存
    // 目前直接返回成功，实际的排行榜数据通过GET接口实时计算

    return NextResponse.json({
      success: true,
      message: '排行榜刷新成功'
    })
  } catch (error) {
    console.error('刷新排行榜失败:', error)
    return NextResponse.json(
      { success: false, message: '刷新排行榜失败' },
      { status: 500 }
    )
  }
}