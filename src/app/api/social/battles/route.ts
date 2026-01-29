import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { coupletBattles, users } from '@/db/schema'
import { eq, desc, count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // 构建查询条件
    let whereCondition = undefined
    if (status && status !== 'all') {
      whereCondition = eq(coupletBattles.status, status)
    }

    // 获取比赛列表，包含参与者统计
    const battles = await db
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
        isPublic: coupletBattles.isPublic,
        language: coupletBattles.language,
        createdAt: coupletBattles.createdAt,
        creatorName: users.name,
        creatorUsername: users.username,
      })
      .from(coupletBattles)
      .leftJoin(users, eq(coupletBattles.creatorId, users.id))
      .where(whereCondition)
      .orderBy(desc(coupletBattles.createdAt))
      .limit(limit)
      .offset(offset)

    // 获取总数
    const totalResult = await db
      .select({ count: count() })
      .from(coupletBattles)
      .where(whereCondition)

    const total = totalResult[0]?.count || 0

    // 计算剩余时间
    const battlesWithTimeLeft = battles.map(battle => {
      let timeLeft = ''
      const now = new Date()
      
      if (battle.status === 'recruiting' && battle.startTime) {
        const diff = new Date(battle.startTime).getTime() - now.getTime()
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          timeLeft = `${hours}小时${minutes}分钟`
        } else {
          timeLeft = '即将开始'
        }
      } else if (battle.status === 'ongoing' && battle.endTime) {
        const diff = new Date(battle.endTime).getTime() - now.getTime()
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          timeLeft = `${hours}小时${minutes}分钟`
        } else {
          timeLeft = '即将结束'
        }
      } else if (battle.status === 'voting' && battle.votingEndTime) {
        const diff = new Date(battle.votingEndTime).getTime() - now.getTime()
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          timeLeft = `投票剩余${hours}小时${minutes}分钟`
        } else {
          timeLeft = '投票即将结束'
        }
      }

      return {
        ...battle,
        timeLeft,
        creator: battle.creatorName || battle.creatorUsername || '未知用户'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        battles: battlesWithTimeLeft,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('获取对联PK列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取对联PK列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      theme,
      creatorId,
      battleType = '1v1',
      maxParticipants = 2,
      timeLimit = 3600,
      votingTimeLimit = 86400,
      rules,
      rewards,
      isPublic = true,
      language = 'zh'
    } = body

    // 验证必填字段
    if (!title || !creatorId) {
      return NextResponse.json(
        { success: false, message: '标题和创建者ID为必填项' },
        { status: 400 }
      )
    }

    // 创建新比赛
    const newBattle = await db.insert(coupletBattles).values({
      title,
      description,
      theme,
      creatorId,
      battleType,
      maxParticipants,
      timeLimit,
      votingTimeLimit,
      rules,
      rewards,
      isPublic,
      language,
      status: 'recruiting',
      currentParticipants: 0
    }).returning()

    return NextResponse.json({
      success: true,
      data: newBattle[0],
      message: '对联PK创建成功'
    })

  } catch (error) {
    console.error('创建对联PK失败:', error)
    return NextResponse.json(
      { success: false, message: '创建对联PK失败' },
      { status: 500 }
    )
  }
}