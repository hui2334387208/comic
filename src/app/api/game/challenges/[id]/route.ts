import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, and, desc } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { timedChallenges, challengeParticipations, users, couplets } from '@/db/schema'
import { publicApiRateLimit } from '@/lib/rate-limit'

// GET /api/game/challenges/[id] - 获取挑战详情
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
    const challengeId = parseInt(id)

    if (isNaN(challengeId)) {
      return NextResponse.json(
        { success: false, message: '无效的挑战ID' },
        { status: 400 }
      )
    }

    const session = await getServerSession(authOptions)

    // 获取挑战信息
    const challenge = await db
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
      .where(eq(timedChallenges.id, challengeId))
      .limit(1)

    if (challenge.length === 0) {
      return NextResponse.json(
        { success: false, message: '挑战不存在' },
        { status: 404 }
      )
    }

    const challengeData = challenge[0]

    // 计算剩余时间
    let timeLeft = ''
    const now = new Date()
    
    if (challengeData.challenge.status === 'upcoming' && challengeData.challenge.startTime) {
      const diff = new Date(challengeData.challenge.startTime).getTime() - now.getTime()
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
    } else if (challengeData.challenge.status === 'active' && challengeData.challenge.endTime) {
      const diff = new Date(challengeData.challenge.endTime).getTime() - now.getTime()
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

    // 获取用户参与状态
    let userParticipation = null
    if (session?.user?.id) {
      const participation = await db
        .select()
        .from(challengeParticipations)
        .where(and(
          eq(challengeParticipations.challengeId, challengeId),
          eq(challengeParticipations.userId, session.user.id)
        ))
        .limit(1)

      if (participation.length > 0) {
        userParticipation = {
          status: participation[0].status,
          rank: participation[0].rank,
          score: participation[0].score,
          joinedAt: participation[0].joinedAt,
          submissionTime: participation[0].submissionTime,
          coupletId: participation[0].coupletId,
        }
      }
    }

    // 获取排行榜（前10名）
    const leaderboard = await db
      .select({
        participation: challengeParticipations,
        user: {
          id: users.id,
          name: users.name,
          username: users.username,
        },
        couplet: {
          id: couplets.id,
          title: couplets.title,
        }
      })
      .from(challengeParticipations)
      .innerJoin(users, eq(challengeParticipations.userId, users.id))
      .leftJoin(couplets, eq(challengeParticipations.coupletId, couplets.id))
      .where(and(
        eq(challengeParticipations.challengeId, challengeId),
        eq(challengeParticipations.status, 'judged')
      ))
      .orderBy(desc(challengeParticipations.score))
      .limit(10)

    // 获取最新提交（最新5个）
    const recentSubmissions = await db
      .select({
        participation: challengeParticipations,
        user: {
          id: users.id,
          name: users.name,
          username: users.username,
        },
        couplet: {
          id: couplets.id,
          title: couplets.title,
        }
      })
      .from(challengeParticipations)
      .innerJoin(users, eq(challengeParticipations.userId, users.id))
      .leftJoin(couplets, eq(challengeParticipations.coupletId, couplets.id))
      .where(and(
        eq(challengeParticipations.challengeId, challengeId),
        eq(challengeParticipations.status, 'submitted')
      ))
      .orderBy(desc(challengeParticipations.submissionTime))
      .limit(5)

    return NextResponse.json({
      success: true,
      data: {
        ...challengeData.challenge,
        creator: challengeData.creator,
        timeLeft,
        userParticipation,
        leaderboard: leaderboard.map(item => ({
          rank: item.participation.rank,
          score: item.participation.score,
          user: item.user,
          couplet: item.couplet,
          submissionTime: item.participation.submissionTime,
        })),
        recentSubmissions: recentSubmissions.map(item => ({
          user: item.user,
          couplet: item.couplet,
          submissionTime: item.participation.submissionTime,
        })),
      }
    })
  } catch (error) {
    console.error('获取挑战详情失败:', error)
    return NextResponse.json(
      { success: false, message: '获取挑战详情失败' },
      { status: 500 }
    )
  }
}