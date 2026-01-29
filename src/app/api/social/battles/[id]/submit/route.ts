import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { coupletBattleParticipants, coupletBattles } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// 提交作品
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
    const { coupletId } = body

    if (!coupletId) {
      return NextResponse.json(
        { success: false, message: '请提供对联ID' },
        { status: 400 }
      )
    }

    // 检查比赛状态
    const battle = await db
      .select()
      .from(coupletBattles)
      .where(eq(coupletBattles.id, battleId))
      .limit(1)

    if (battle.length === 0) {
      return NextResponse.json(
        { success: false, message: '比赛不存在' },
        { status: 404 }
      )
    }

    if (battle[0].status !== 'ongoing') {
      return NextResponse.json(
        { success: false, message: '比赛未在进行中，无法提交作品' },
        { status: 400 }
      )
    }

    // 检查是否已参加比赛
    const participant = await db
      .select()
      .from(coupletBattleParticipants)
      .where(and(
        eq(coupletBattleParticipants.battleId, battleId),
        eq(coupletBattleParticipants.userId, userId)
      ))
      .limit(1)

    if (participant.length === 0) {
      return NextResponse.json(
        { success: false, message: '您未参加此比赛' },
        { status: 400 }
      )
    }

    if (participant[0].status === 'submitted') {
      return NextResponse.json(
        { success: false, message: '您已经提交过作品' },
        { status: 400 }
      )
    }

    // 更新参与者状态
    const updatedParticipant = await db
      .update(coupletBattleParticipants)
      .set({
        coupletId: coupletId,
        submissionTime: new Date(),
        status: 'submitted'
      })
      .where(eq(coupletBattleParticipants.id, participant[0].id))
      .returning()

    return NextResponse.json({
      success: true,
      data: updatedParticipant[0],
      message: '作品提交成功'
    })

  } catch (error) {
    console.error('提交作品失败:', error)
    return NextResponse.json(
      { success: false, message: '提交作品失败' },
      { status: 500 }
    )
  }
}