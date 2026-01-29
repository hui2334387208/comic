import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { coupletBattleVotes, coupletBattleParticipants } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// 投票
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
    const battleId = parseInt(id)
    const userId = session.user.id
    const body = await request.json()
    const { participantId, score = 1, comment } = body

    // 检查是否已经投过票
    const existingVote = await db
      .select()
      .from(coupletBattleVotes)
      .where(and(
        eq(coupletBattleVotes.battleId, battleId),
        eq(coupletBattleVotes.voterId, userId),
        eq(coupletBattleVotes.participantId, participantId)
      ))
      .limit(1)

    if (existingVote.length > 0) {
      return NextResponse.json(
        { success: false, message: '您已经投过票了' },
        { status: 400 }
      )
    }

    // 添加投票
    await db.insert(coupletBattleVotes).values({
      battleId,
      voterId: userId,
      participantId,
      score,
      comment,
      voteType: 'like'
    })

    // 更新参与者得分
    const participant = await db
      .select()
      .from(coupletBattleParticipants)
      .where(eq(coupletBattleParticipants.id, participantId))
      .limit(1)

    if (participant.length > 0) {
      await db
        .update(coupletBattleParticipants)
        .set({
          score: (participant[0].score || 0) + score
        })
        .where(eq(coupletBattleParticipants.id, participantId))
    }

    return NextResponse.json({
      success: true,
      message: '投票成功'
    })

  } catch (error) {
    console.error('投票失败:', error)
    return NextResponse.json(
      { success: false, message: '投票失败' },
      { status: 500 }
    )
  }
}