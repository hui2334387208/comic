import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { coupletBattles, coupletBattleParticipants } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const battleId = parseInt(id)
    const body = await request.json()
    const { userId } = body

    if (isNaN(battleId)) {
      return NextResponse.json(
        { success: false, message: '无效的比赛ID' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: '缺少用户ID' },
        { status: 400 }
      )
    }

    // 检查比赛是否存在
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

    const battleData = battle[0]

    // 检查比赛状态
    if (battleData.status !== 'recruiting') {
      return NextResponse.json(
        { success: false, message: '比赛不在招募阶段' },
        { status: 400 }
      )
    }

    // 检查人数限制
    if ((battleData.currentParticipants || 0) >= (battleData.maxParticipants || 0)) {
      return NextResponse.json(
        { success: false, message: '比赛人数已满' },
        { status: 400 }
      )
    }

    // 检查是否已经参与
    const existingParticipant = await db
      .select()
      .from(coupletBattleParticipants)
      .where(
        and(
          eq(coupletBattleParticipants.battleId, battleId),
          eq(coupletBattleParticipants.userId, userId)
        )
      )
      .limit(1)

    if (existingParticipant.length > 0) {
      return NextResponse.json(
        { success: false, message: '你已经参与了该比赛' },
        { status: 400 }
      )
    }

    // 添加参与者
    const newParticipant = await db.insert(coupletBattleParticipants).values({
      battleId,
      userId,
      status: 'joined'
    }).returning()

    // 更新比赛的参与者数量
    await db
      .update(coupletBattles)
      .set({ 
        currentParticipants: (battleData.currentParticipants || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(coupletBattles.id, battleId))

    return NextResponse.json({
      success: true,
      data: newParticipant[0],
      message: '成功加入比赛'
    })

  } catch (error) {
    console.error('加入比赛失败:', error)
    return NextResponse.json(
      { success: false, message: '加入比赛失败' },
      { status: 500 }
    )
  }
}