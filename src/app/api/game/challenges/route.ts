import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, desc, count, and, gte, lte } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { timedChallenges, challengeParticipations, users } from '@/db/schema'
import { publicApiRateLimit } from '@/lib/rate-limit'

// GET /api/game/challenges - 获取限时挑战列表
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
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // 构建查询条件
    const whereConditions = [eq(timedChallenges.isPublic, true)]

    if (status && status !== 'all') {
      whereConditions.push(eq(timedChallenges.status, status))
    }

    // 获取挑战列表
    const challenges = await db
      .select({
        challenge: timedChallenges,
        creator: {
          id: users.id,
          name: users.name,
          username: users.username,
        }
      })
      .from(timedChallenges)
      .leftJoin(users, eq(timedChallenges.createdBy, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(timedChallenges.createdAt))
      .limit(limit)
      .offset(offset)

    // 获取总数
    const totalResult = await db
      .select({ count: count() })
      .from(timedChallenges)
      .where(and(...whereConditions))

    const total = totalResult[0]?.count || 0

    // 如果用户已登录，获取用户参与状态
    let userParticipations: any[] = []
    if (session?.user?.id) {
      const challengeIds = challenges.map(c => c.challenge.id)
      if (challengeIds.length > 0) {
        userParticipations = await db
          .select()
          .from(challengeParticipations)
          .where(and(
            eq(challengeParticipations.userId, session.user.id),
            // TODO: 添加 challengeId in challengeIds 的条件
          ))
      }
    }

    // 合并挑战和用户参与数据，计算剩余时间
    const challengesWithDetails = challenges.map(({ challenge, creator }) => {
      const userParticipation = userParticipations.find(p => p.challengeId === challenge.id)
      
      // 计算剩余时间
      let timeLeft = ''
      const now = new Date()
      
      if (challenge.status === 'upcoming' && challenge.startTime) {
        const diff = new Date(challenge.startTime).getTime() - now.getTime()
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24))
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          
          if (days > 0) {
            timeLeft = `${days}天${hours}小时`
          } else if (hours > 0) {
            timeLeft = `${hours}小时${minutes}分钟`
          } else {
            timeLeft = `${minutes}分钟`
          }
        } else {
          timeLeft = '即将开始'
        }
      } else if (challenge.status === 'active' && challenge.endTime) {
        const diff = new Date(challenge.endTime).getTime() - now.getTime()
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24))
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          
          if (days > 0) {
            timeLeft = `${days}天${hours}小时`
          } else if (hours > 0) {
            timeLeft = `${hours}小时${minutes}分钟`
          } else {
            timeLeft = `${minutes}分钟`
          }
        } else {
          timeLeft = '即将结束'
        }
      }

      return {
        ...challenge,
        creator: creator || null,
        timeLeft,
        userParticipation: userParticipation ? {
          status: userParticipation.status,
          rank: userParticipation.rank,
          score: userParticipation.score,
          joinedAt: userParticipation.joinedAt,
          submissionTime: userParticipation.submissionTime,
        } : null
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        challenges: challengesWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取挑战列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取挑战列表失败' },
      { status: 500 }
    )
  }
}

// POST /api/game/challenges - 创建新挑战（管理员功能）
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      )
    }

    // TODO: 检查管理员权限

    const body = await request.json()
    const {
      title,
      description,
      theme,
      challengeType,
      difficulty,
      startTime,
      endTime,
      maxParticipants,
      requirements,
      rewards,
      rules,
      judgeType,
      isPublic,
      language
    } = body

    // 验证必填字段
    if (!title || !description || !challengeType || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, message: '请填写所有必填字段' },
        { status: 400 }
      )
    }

    // 验证时间
    const start = new Date(startTime)
    const end = new Date(endTime)
    if (start >= end) {
      return NextResponse.json(
        { success: false, message: '结束时间必须晚于开始时间' },
        { status: 400 }
      )
    }

    const newChallenge = await db
      .insert(timedChallenges)
      .values({
        title,
        description,
        theme,
        challengeType: challengeType || 'theme_creation',
        difficulty: difficulty || 'medium',
        status: start > new Date() ? 'upcoming' : 'active',
        startTime: start,
        endTime: end,
        maxParticipants,
        currentParticipants: 0,
        requirements: requirements || {},
        rewards: rewards || {},
        rules: rules || {},
        judgeType: judgeType || 'auto',
        isPublic: isPublic !== false,
        language: language || 'zh',
        createdBy: session.user.id,
      })
      .returning()

    return NextResponse.json({
      success: true,
      data: newChallenge[0],
      message: '挑战创建成功'
    })
  } catch (error) {
    console.error('创建挑战失败:', error)
    return NextResponse.json(
      { success: false, message: '创建挑战失败' },
      { status: 500 }
    )
  }
}