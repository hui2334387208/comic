import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, and } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { timedChallenges, challengeParticipations, userPoints, userPointsSummary } from '@/db/schema'
import { publicApiRateLimit } from '@/lib/rate-limit'

// POST /api/game/challenges/[id]/participate - 参与挑战
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const userId = session.user.id // 确保userId不为undefined

    const { id } = await context.params
    const challengeId = parseInt(id)

    if (isNaN(challengeId)) {
      return NextResponse.json(
        { success: false, message: '无效的挑战ID' },
        { status: 400 }
      )
    }

    // 获取挑战信息
    const challenge = await db
      .select()
      .from(timedChallenges)
      .where(eq(timedChallenges.id, challengeId))
      .limit(1)

    if (challenge.length === 0) {
      return NextResponse.json(
        { success: false, message: '挑战不存在' },
        { status: 404 }
      )
    }

    const challengeData = challenge[0]

    // 检查挑战状态
    if (challengeData.status !== 'active' && challengeData.status !== 'upcoming') {
      return NextResponse.json(
        { success: false, message: '挑战已结束或已取消' },
        { status: 400 }
      )
    }

    // 检查是否已经参与
    const existingParticipation = await db
      .select()
      .from(challengeParticipations)
      .where(and(
        eq(challengeParticipations.challengeId, challengeId),
        eq(challengeParticipations.userId, userId)
      ))
      .limit(1)

    if (existingParticipation.length > 0) {
      return NextResponse.json(
        { success: false, message: '您已经参与了这个挑战' },
        { status: 400 }
      )
    }

    // 检查参与人数限制
    if (challengeData.maxParticipants && (challengeData.currentParticipants || 0) >= challengeData.maxParticipants) {
      return NextResponse.json(
        { success: false, message: '挑战参与人数已满' },
        { status: 400 }
      )
    }

    await db.transaction(async (tx) => {
      // 创建参与记录
      await tx.insert(challengeParticipations).values({
        challengeId,
        userId: userId,
        status: 'registered',
      })

      // 更新挑战参与人数
      await tx
        .update(timedChallenges)
        .set({
          currentParticipants: (challengeData.currentParticipants || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(timedChallenges.id, challengeId))

      // 给予参与奖励积分
      const participationPoints = 30
      await tx.insert(userPoints).values({
        userId: userId,
        pointType: 'challenge_participate',
        points: participationPoints,
        source: 'challenge',
        sourceId: challengeId,
        description: `参与挑战：${challengeData.title}`,
      })

      // 更新用户积分汇总
      const summary = await tx
        .select()
        .from(userPointsSummary)
        .where(eq(userPointsSummary.userId, userId))
        .limit(1)

      if (summary.length > 0) {
        const summaryData = summary[0]
        await tx
          .update(userPointsSummary)
          .set({
            totalPoints: (summaryData.totalPoints || 0) + participationPoints,
            availablePoints: (summaryData.availablePoints || 0) + participationPoints,
            updatedAt: new Date(),
          })
          .where(eq(userPointsSummary.userId, userId))
      } else {
        await tx.insert(userPointsSummary).values({
          userId: userId,
          totalPoints: participationPoints,
          availablePoints: participationPoints,
          level: 1,
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: '成功参与挑战！获得30积分奖励',
      data: {
        challengeId,
        status: 'registered',
        points: 30
      }
    })
  } catch (error) {
    console.error('参与挑战失败:', error)
    return NextResponse.json(
      { success: false, message: '参与挑战失败' },
      { status: 500 }
    )
  }
}

// DELETE /api/game/challenges/[id]/participate - 退出挑战
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      )
    }

    const userId = session.user.id // 确保userId不为undefined

    const { id } = await context.params
    const challengeId = parseInt(id)

    if (isNaN(challengeId)) {
      return NextResponse.json(
        { success: false, message: '无效的挑战ID' },
        { status: 400 }
      )
    }

    // 获取参与记录
    const participation = await db
      .select()
      .from(challengeParticipations)
      .where(and(
        eq(challengeParticipations.challengeId, challengeId),
        eq(challengeParticipations.userId, userId)
      ))
      .limit(1)

    if (participation.length === 0) {
      return NextResponse.json(
        { success: false, message: '您没有参与这个挑战' },
        { status: 400 }
      )
    }

    const participationData = participation[0]

    // 检查是否可以退出（已提交作品后不能退出）
    if (participationData.status === 'submitted' || participationData.status === 'judged') {
      return NextResponse.json(
        { success: false, message: '已提交作品后不能退出挑战' },
        { status: 400 }
      )
    }

    // 获取挑战信息
    const challenge = await db
      .select()
      .from(timedChallenges)
      .where(eq(timedChallenges.id, challengeId))
      .limit(1)

    if (challenge.length === 0) {
      return NextResponse.json(
        { success: false, message: '挑战不存在' },
        { status: 404 }
      )
    }

    await db.transaction(async (tx) => {
      // 删除参与记录
      await tx
        .delete(challengeParticipations)
        .where(and(
          eq(challengeParticipations.challengeId, challengeId),
          eq(challengeParticipations.userId, userId)
        ))

      // 更新挑战参与人数
      await tx
        .update(timedChallenges)
        .set({
          currentParticipants: Math.max(0, (challenge[0].currentParticipants || 0) - 1),
          updatedAt: new Date(),
        })
        .where(eq(timedChallenges.id, challengeId))
    })

    return NextResponse.json({
      success: true,
      message: '成功退出挑战'
    })
  } catch (error) {
    console.error('退出挑战失败:', error)
    return NextResponse.json(
      { success: false, message: '退出挑战失败' },
      { status: 500 }
    )
  }
}