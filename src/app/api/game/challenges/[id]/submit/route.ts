import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, and } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { 
  timedChallenges, 
  challengeParticipations, 
  couplets,
  coupletContents,
  coupletVersions,
  userPoints,
  userPointsSummary
} from '@/db/schema'
import { publicApiRateLimit } from '@/lib/rate-limit'

// POST /api/game/challenges/[id]/submit - 提交挑战作品
export async function POST(
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

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      )
    }

    const userId = session.user.id // 确保userId不为undefined

    const { id } = await params
    const challengeId = parseInt(id)

    if (isNaN(challengeId)) {
      return NextResponse.json(
        { success: false, message: '无效的挑战ID' },
        { status: 400 }
      )
    }

    const { firstLine, secondLine, description } = await request.json()

    if (!firstLine || !secondLine) {
      return NextResponse.json(
        { success: false, message: '请输入完整的对联' },
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
    if (challengeData.status !== 'active') {
      return NextResponse.json(
        { success: false, message: '挑战未在进行中' },
        { status: 400 }
      )
    }

    // 检查是否在时间范围内
    const now = new Date()
    if (now < challengeData.startTime || now > challengeData.endTime) {
      return NextResponse.json(
        { success: false, message: '不在挑战时间范围内' },
        { status: 400 }
      )
    }

    // 检查用户参与状态
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
        { success: false, message: '您未参与此挑战' },
        { status: 400 }
      )
    }

    const participationData = participation[0]

    if (participationData.status === 'submitted') {
      return NextResponse.json(
        { success: false, message: '您已提交过作品' },
        { status: 400 }
      )
    }

    // 验证对联要求
    const validationResult = validateCouplet(firstLine, secondLine, challengeData.requirements)
    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, message: validationResult.message },
        { status: 400 }
      )
    }

    await db.transaction(async (tx) => {
      // 创建对联记录
      const newCouplet = await tx
        .insert(couplets)
        .values({
          title: `${firstLine} ${secondLine}`,
          slug: `challenge-${challengeId}-${Date.now()}`,
          description: description || '',
          authorId: userId,
          isPublic: true,
        })
        .returning()

      // 创建对联版本
      const newVersion = await tx
        .insert(coupletVersions)
        .values({
          coupletId: newCouplet[0].id,
          version: 1,
          isLatestVersion: true,
        })
        .returning()

      // 创建对联内容
      await tx
        .insert(coupletContents)
        .values({
          coupletId: newCouplet[0].id,
          versionId: newVersion[0].id,
          upperLine: firstLine,
          lowerLine: secondLine,
        })

      const coupletId = newCouplet[0].id

      // 计算分数（简化处理）
      const score = calculateChallengeScore(firstLine, secondLine, challengeData.requirements)

      // 更新参与记录
      await tx
        .update(challengeParticipations)
        .set({
          coupletId,
          submissionTime: new Date(),
          score: score.toString(),
          status: 'submitted',
          metadata: {
            autoScore: score,
            validationResult,
          },
          updatedAt: new Date(),
        })
        .where(eq(challengeParticipations.id, participationData.id))

      // 给予参与奖励积分
      const participationPoints = (challengeData.rewards as any)?.participation?.points || 0
      if (participationPoints > 0) {
        await tx.insert(userPoints).values({
          userId: userId,
          pointType: 'challenge_participation',
          points: participationPoints,
          source: 'challenge_submission',
          sourceId: challengeId,
          description: `参与挑战：${challengeData.title}`,
        })

        // 更新积分汇总
        const summary = await tx
          .select()
          .from(userPointsSummary)
          .where(eq(userPointsSummary.userId, userId))
          .limit(1)

        if (summary.length > 0) {
          await tx
            .update(userPointsSummary)
            .set({
              totalPoints: (summary[0].totalPoints || 0) + participationPoints,
              availablePoints: (summary[0].availablePoints || 0) + participationPoints,
              updatedAt: new Date(),
            })
            .where(eq(userPointsSummary.userId, userId))
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: '作品提交成功！',
      data: {
        score: calculateChallengeScore(firstLine, secondLine, challengeData.requirements),
        participationPoints: (challengeData.rewards as any)?.participation?.points || 0,
      }
    })
  } catch (error) {
    console.error('提交挑战作品失败:', error)
    return NextResponse.json(
      { success: false, message: '提交挑战作品失败' },
      { status: 500 }
    )
  }
}

// 验证对联是否符合要求
function validateCouplet(firstLine: string, secondLine: string, requirements: any) {
  if (!requirements) {
    return { valid: true }
  }

  // 检查字数要求
  if (requirements.minWords && firstLine.length < requirements.minWords) {
    return { valid: false, message: `上联字数不足${requirements.minWords}字` }
  }

  if (requirements.maxWords && firstLine.length > requirements.maxWords) {
    return { valid: false, message: `上联字数超过${requirements.maxWords}字` }
  }

  if (requirements.minWords && secondLine.length < requirements.minWords) {
    return { valid: false, message: `下联字数不足${requirements.minWords}字` }
  }

  if (requirements.maxWords && secondLine.length > requirements.maxWords) {
    return { valid: false, message: `下联字数超过${requirements.maxWords}字` }
  }

  // 检查字数对等
  if (firstLine.length !== secondLine.length) {
    return { valid: false, message: '上下联字数必须相等' }
  }

  // 检查必须包含的词汇
  if (requirements.mustInclude && Array.isArray(requirements.mustInclude)) {
    const content = firstLine + secondLine
    for (const word of requirements.mustInclude) {
      if (!content.includes(word)) {
        return { valid: false, message: `对联必须包含"${word}"` }
      }
    }
  }

  return { valid: true }
}

// 计算挑战分数
function calculateChallengeScore(firstLine: string, secondLine: string, requirements: any): number {
  let score = 60 // 基础分

  // 字数匹配度
  if (firstLine.length === secondLine.length) {
    score += 20
  }

  // 主题相关性（简化处理）
  if (requirements?.theme) {
    const content = firstLine + secondLine
    if (content.includes(requirements.theme)) {
      score += 15
    }
  }

  // 必须包含词汇的完成度
  if (requirements?.mustInclude && Array.isArray(requirements.mustInclude)) {
    const content = firstLine + secondLine
    const includeCount = requirements.mustInclude.filter((word: string) => 
      content.includes(word)
    ).length
    score += (includeCount / requirements.mustInclude.length) * 15
  }

  return Math.min(100, Math.max(0, Math.round(score)))
}