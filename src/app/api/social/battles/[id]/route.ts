import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { coupletBattles, coupletBattleParticipants, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const battleId = parseInt(id)

    if (isNaN(battleId)) {
      return NextResponse.json(
        { success: false, message: '无效的比赛ID' },
        { status: 400 }
      )
    }

    // 获取比赛基本信息
    const battle = await db
      .select({
        id: coupletBattles.id,
        title: coupletBattles.title,
        description: coupletBattles.description,
        theme: coupletBattles.theme,
        status: coupletBattles.status,
        battleType: coupletBattles.battleType,
        maxParticipants: coupletBattles.maxParticipants,
        currentParticipants: coupletBattles.currentParticipants,
        timeLimit: coupletBattles.timeLimit,
        votingTimeLimit: coupletBattles.votingTimeLimit,
        startTime: coupletBattles.startTime,
        endTime: coupletBattles.endTime,
        votingStartTime: coupletBattles.votingStartTime,
        votingEndTime: coupletBattles.votingEndTime,
        rewards: coupletBattles.rewards,
        rules: coupletBattles.rules,
        createdAt: coupletBattles.createdAt,
        creatorName: users.name,
        creatorUsername: users.username,
      })
      .from(coupletBattles)
      .leftJoin(users, eq(coupletBattles.creatorId, users.id))
      .where(eq(coupletBattles.id, battleId))
      .limit(1)

    if (battle.length === 0) {
      return NextResponse.json(
        { success: false, message: '比赛不存在' },
        { status: 404 }
      )
    }

    // 获取参与者信息
    const participants = await db
      .select({
        id: coupletBattleParticipants.id,
        userId: coupletBattleParticipants.userId,
        coupletId: coupletBattleParticipants.coupletId,
        submissionTime: coupletBattleParticipants.submissionTime,
        status: coupletBattleParticipants.status,
        score: coupletBattleParticipants.score,
        rank: coupletBattleParticipants.rank,
        joinedAt: coupletBattleParticipants.joinedAt,
        userName: users.name,
        userUsername: users.username,
      })
      .from(coupletBattleParticipants)
      .leftJoin(users, eq(coupletBattleParticipants.userId, users.id))
      .where(eq(coupletBattleParticipants.battleId, battleId))
      .orderBy(coupletBattleParticipants.joinedAt)

    const battleData = battle[0]

    // 计算剩余时间
    let timeLeft = ''
    const now = new Date()
    
    if (battleData.status === 'recruiting' && battleData.startTime) {
      const diff = new Date(battleData.startTime).getTime() - now.getTime()
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        timeLeft = `${hours}小时${minutes}分钟`
      } else {
        timeLeft = '即将开始'
      }
    } else if (battleData.status === 'ongoing' && battleData.endTime) {
      const diff = new Date(battleData.endTime).getTime() - now.getTime()
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        timeLeft = `${hours}小时${minutes}分钟`
      } else {
        timeLeft = '即将结束'
      }
    } else if (battleData.status === 'voting' && battleData.votingEndTime) {
      const diff = new Date(battleData.votingEndTime).getTime() - now.getTime()
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        timeLeft = `投票剩余${hours}小时${minutes}分钟`
      } else {
        timeLeft = '投票即将结束'
      }
    }

    const battleDetail = {
      ...battleData,
      creator: battleData.creatorName || battleData.creatorUsername || '未知用户',
      timeLeft,
      participants: participants.map(p => ({
        ...p,
        user: p.userName || p.userUsername || '未知用户'
      })),
      rules: battleData.rules ? (typeof battleData.rules === 'string' ? battleData.rules : JSON.stringify(battleData.rules)) : '',
      rewards: battleData.rewards ? (typeof battleData.rewards === 'string' ? battleData.rewards : JSON.stringify(battleData.rewards)) : ''
    }

    return NextResponse.json({
      success: true,
      data: battleDetail
    })

  } catch (error) {
    console.error('获取比赛详情失败:', error)
    return NextResponse.json(
      { success: false, message: '获取比赛详情失败' },
      { status: 500 }
    )
  }
}