import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { 
  gamificationLevels, 
  achievements, 
  badges, 
  timedChallenges 
} from '@/db/schema'
import initGameData from '@/data/init-game-data.json'

// POST /api/admin/init-game - 初始化游戏数据
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
    // 这里应该检查用户是否有管理员权限

    const { type } = await request.json()

    let result = { success: true, message: '', data: {} }

    switch (type) {
      case 'levels':
        await initLevels()
        result.message = '关卡数据初始化成功'
        break
      
      case 'achievements':
        await initAchievements()
        result.message = '成就数据初始化成功'
        break
      
      case 'badges':
        await initBadges()
        result.message = '徽章数据初始化成功'
        break
      
      case 'challenges':
        await initChallenges(session.user.id)
        result.message = '挑战数据初始化成功'
        break
      
      case 'all':
        await initLevels()
        await initAchievements()
        await initBadges()
        await initChallenges(session.user.id)
        result.message = '所有游戏数据初始化成功'
        break
      
      default:
        return NextResponse.json(
          { success: false, message: '无效的初始化类型' },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('初始化游戏数据失败:', error)
    return NextResponse.json(
      { success: false, message: '初始化游戏数据失败' },
      { status: 500 }
    )
  }
}

// 初始化关卡数据
async function initLevels() {
  const levels = initGameData.levels

  for (const levelData of levels) {
    // 检查关卡是否已存在
    const existing = await db
      .select()
      .from(gamificationLevels)
      .where(eq(gamificationLevels.name, levelData.name))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(gamificationLevels).values({
        name: levelData.name,
        description: levelData.description,
        difficulty: levelData.difficulty as any,
        levelType: levelData.levelType as any,
        requirements: levelData.requirements,
        rewards: levelData.rewards,
        unlockConditions: levelData.unlockConditions,
        orderIndex: levelData.orderIndex,
        maxAttempts: levelData.maxAttempts,
        timeLimit: levelData.timeLimit,
        passingScore: levelData.passingScore,
        language: levelData.language,
        isActive: true,
      })
    }
  }
}

// 初始化成就数据
async function initAchievements() {
  const achievementsList = initGameData.achievements

  for (const achievementData of achievementsList) {
    // 检查成就是否已存在
    const existing = await db
      .select()
      .from(achievements)
      .where(eq(achievements.name, achievementData.name))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(achievements).values({
        name: achievementData.name,
        description: achievementData.description,
        icon: achievementData.icon,
        category: achievementData.category,
        type: achievementData.type as any,
        condition: achievementData.condition,
        rewards: achievementData.rewards,
        rarity: achievementData.rarity as any,
        language: achievementData.language,
        isActive: true,
        isHidden: false,
        orderIndex: 0,
      })
    }
  }
}

// 初始化徽章数据
async function initBadges() {
  const badgesList = initGameData.badges

  for (const badgeData of badgesList) {
    // 检查徽章是否已存在
    const existing = await db
      .select()
      .from(badges)
      .where(eq(badges.name, badgeData.name))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(badges).values({
        name: badgeData.name,
        description: badgeData.description,
        icon: badgeData.icon,
        color: badgeData.color,
        category: badgeData.category,
        rarity: badgeData.rarity as any,
        condition: badgeData.condition,
        language: badgeData.language,
        isActive: true,
        orderIndex: 0,
      })
    }
  }
}

// 初始化挑战数据
async function initChallenges(createdBy: string) {
  const challengesList = initGameData.challenges

  for (const challengeData of challengesList) {
    // 检查挑战是否已存在
    const existing = await db
      .select()
      .from(timedChallenges)
      .where(eq(timedChallenges.title, challengeData.title))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(timedChallenges).values({
        title: challengeData.title,
        description: challengeData.description,
        theme: challengeData.theme,
        challengeType: challengeData.challengeType as any,
        difficulty: challengeData.difficulty as any,
        status: challengeData.status as any,
        startTime: new Date(challengeData.startTime),
        endTime: new Date(challengeData.endTime),
        maxParticipants: challengeData.maxParticipants,
        currentParticipants: 0,
        requirements: challengeData.requirements,
        rewards: challengeData.rewards,
        rules: challengeData.rules,
        judgeType: challengeData.judgeType as any,
        isPublic: challengeData.isPublic,
        language: challengeData.language,
        createdBy,
      })
    }
  }
}