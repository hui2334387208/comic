import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, and, asc, desc } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { gamificationLevels, userLevelProgress } from '@/db/schema'
import { publicApiRateLimit } from '@/lib/rate-limit'

// GET /api/game/levels - 获取关卡列表
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
    const difficulty = searchParams.get('difficulty')
    const levelType = searchParams.get('type')
    const language = searchParams.get('language') || 'zh'

    // 构建查询条件
    const whereConditions = [
      eq(gamificationLevels.isActive, true),
      eq(gamificationLevels.language, language)
    ]

    if (difficulty && difficulty !== 'all') {
      whereConditions.push(eq(gamificationLevels.difficulty, difficulty))
    }

    if (levelType && levelType !== 'all') {
      whereConditions.push(eq(gamificationLevels.levelType, levelType))
    }

    // 获取关卡列表
    const levels = await db
      .select()
      .from(gamificationLevels)
      .where(and(...whereConditions))
      .orderBy(asc(gamificationLevels.orderIndex))

    // 如果用户已登录，获取用户进度
    let userProgress: any[] = []
    if (session?.user?.id) {
      userProgress = await db
        .select()
        .from(userLevelProgress)
        .where(eq(userLevelProgress.userId, session.user.id))
    }

    // 合并关卡和用户进度数据
    const levelsWithProgress = levels.map((level, index) => {
      const progress = userProgress.find(p => p.levelId === level.id)
      
      // 判断关卡是否解锁
      let isUnlocked = false
      if (index === 0) {
        // 第一关总是解锁的
        isUnlocked = true
      } else if (progress) {
        // 如果有进度记录，根据状态判断
        isUnlocked = progress.status !== 'locked'
      } else {
        // 检查前一关是否完成
        const prevLevel = levels[index - 1]
        const prevProgress = userProgress.find(p => p.levelId === prevLevel.id)
        isUnlocked = prevProgress?.status === 'completed'
      }

      return {
        ...level,
        userProgress: progress || null,
        isUnlocked,
      }
    })

    return NextResponse.json({
      success: true,
      data: levelsWithProgress,
      total: levels.length
    })
  } catch (error) {
    console.error('获取关卡列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取关卡列表失败' },
      { status: 500 }
    )
  }
}

// POST /api/game/levels - 创建新关卡（管理员功能）
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      )
    }

    // 检查管理员权限（这里简化处理，实际应该检查用户角色）
    // TODO: 添加权限检查

    const body = await request.json()
    const {
      name,
      description,
      difficulty,
      levelType,
      requirements,
      rewards,
      unlockConditions,
      orderIndex,
      maxAttempts,
      timeLimit,
      passingScore,
      language
    } = body

    // 验证必填字段
    if (!name || !description || !difficulty || !levelType) {
      return NextResponse.json(
        { success: false, message: '请填写所有必填字段' },
        { status: 400 }
      )
    }

    const newLevel = await db
      .insert(gamificationLevels)
      .values({
        name,
        description,
        difficulty,
        levelType,
        requirements: requirements || {},
        rewards: rewards || {},
        unlockConditions: unlockConditions || {},
        orderIndex: orderIndex || 0,
        maxAttempts: maxAttempts || 3,
        timeLimit: timeLimit || 1800,
        passingScore: passingScore || 60,
        language: language || 'zh',
        isActive: true,
      })
      .returning()

    return NextResponse.json({
      success: true,
      data: newLevel[0],
      message: '关卡创建成功'
    })
  } catch (error) {
    console.error('创建关卡失败:', error)
    return NextResponse.json(
      { success: false, message: '创建关卡失败' },
      { status: 500 }
    )
  }
}