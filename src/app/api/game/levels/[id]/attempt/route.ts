import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, and } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { 
  gamificationLevels, 
  userLevelProgress, 
  userPoints, 
  userPointsSummary,
  userAchievements,
  achievements
} from '@/db/schema'
import { AchievementSystem } from '@/lib/achievement-system'
import { publicApiRateLimit } from '@/lib/rate-limit'

// 等级配置
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000, 50000
]

function calculateLevel(totalPoints: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_THRESHOLDS[i]) {
      return i + 1
    }
  }
  return 1
}

function calculateLevelProgress(totalPoints: number): number {
  const level = calculateLevel(totalPoints)
  if (level >= LEVEL_THRESHOLDS.length) return 100
  
  const currentThreshold = LEVEL_THRESHOLDS[level - 1]
  const nextThreshold = LEVEL_THRESHOLDS[level]
  
  return Math.floor(((totalPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
}

function getNextLevelThreshold(totalPoints: number): number {
  const level = calculateLevel(totalPoints)
  if (level >= LEVEL_THRESHOLDS.length) return 0
  
  return LEVEL_THRESHOLDS[level] - totalPoints
}

// POST /api/game/levels/[id]/attempt - 开始关卡挑战
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
    const levelId = parseInt(id)

    if (isNaN(levelId)) {
      return NextResponse.json(
        { success: false, message: '无效的关卡ID' },
        { status: 400 }
      )
    }

    const { action, submissionData, timeSpent } = await request.json()

    // 获取关卡信息
    const level = await db
      .select()
      .from(gamificationLevels)
      .where(and(
        eq(gamificationLevels.id, levelId),
        eq(gamificationLevels.isActive, true)
      ))
      .limit(1)

    if (level.length === 0) {
      return NextResponse.json(
        { success: false, message: '关卡不存在' },
        { status: 404 }
      )
    }

    const levelData = level[0]

    // 获取用户进度
    const userProgress = await db
      .select()
      .from(userLevelProgress)
      .where(and(
        eq(userLevelProgress.userId, userId),
        eq(userLevelProgress.levelId, levelId)
      ))
      .limit(1)

    if (userProgress.length === 0) {
      return NextResponse.json(
        { success: false, message: '关卡未解锁' },
        { status: 403 }
      )
    }

    const currentProgress = userProgress[0]

    if (action === 'start') {
      // 开始挑战
      if ((currentProgress.attempts || 0) >= (levelData.maxAttempts || 3)) {
        return NextResponse.json(
          { success: false, message: '已达到最大尝试次数' },
          { status: 400 }
        )
      }

      // 更新进度状态
      await db
        .update(userLevelProgress)
        .set({
          status: 'in_progress',
          lastAttemptAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userLevelProgress.id, currentProgress.id))

      return NextResponse.json({
        success: true,
        message: '关卡挑战已开始',
        data: {
          levelId,
          timeLimit: levelData.timeLimit || 1800,
          passingScore: levelData.passingScore || 60,
          attempts: (currentProgress.attempts || 0) + 1,
          maxAttempts: levelData.maxAttempts || 3,
        }
      })
    } else if (action === 'submit') {
      // 提交挑战结果
      if (currentProgress.status !== 'in_progress') {
        return NextResponse.json(
          { success: false, message: '关卡未在进行中' },
          { status: 400 }
        )
      }

      // 计算分数（这里简化处理，实际应该根据具体的评分逻辑）
      const score = calculateScore(submissionData, levelData.requirements)
      const passed = score >= (levelData.passingScore || 60)
      const newAttempts = (currentProgress.attempts || 0) + 1
      const newBestScore = Math.max(currentProgress.bestScore || 0, score)
      const newTotalScore = (currentProgress.totalScore || 0) + score

      let newStatus: 'completed' | 'failed' | 'unlocked' = passed ? 'completed' : 
        (newAttempts >= (levelData.maxAttempts || 3) ? 'failed' : 'unlocked')

      // 更新用户进度
      const updateData: any = {
        status: newStatus,
        attempts: newAttempts,
        bestScore: newBestScore,
        totalScore: newTotalScore,
        timeSpent: (currentProgress.timeSpent || 0) + (timeSpent || 0),
        submissionData,
        lastAttemptAt: new Date(),
        updatedAt: new Date(),
      }

      if (passed) {
        updateData.completedAt = new Date()
      }

      await db.transaction(async (tx) => {
        // 更新关卡进度
        await tx
          .update(userLevelProgress)
          .set(updateData)
          .where(eq(userLevelProgress.id, currentProgress.id))

        // 如果通关，给予奖励
        if (passed) {
          const rewardPoints = (levelData.rewards as any)?.points || 0
          
          if (rewardPoints > 0) {
            // 添加积分记录
            await tx.insert(userPoints).values({
              userId: userId,
              pointType: 'level_complete',
              points: rewardPoints,
              source: 'level_completion',
              sourceId: levelId,
              description: `完成关卡：${levelData.name}`,
            })

            // 更新积分汇总
            const summary = await tx
              .select()
              .from(userPointsSummary)
              .where(eq(userPointsSummary.userId, userId))
              .limit(1)

            if (summary.length === 0) {
              await tx.insert(userPointsSummary).values({
                userId: userId,
                totalPoints: rewardPoints,
                availablePoints: rewardPoints,
                level: calculateLevel(rewardPoints),
                levelProgress: calculateLevelProgress(rewardPoints),
                nextLevelPoints: getNextLevelThreshold(rewardPoints),
              })
            } else {
              const newTotalPoints = summary[0].totalPoints + rewardPoints
              await tx
                .update(userPointsSummary)
                .set({
                  totalPoints: newTotalPoints,
                  availablePoints: summary[0].availablePoints + rewardPoints,
                  level: calculateLevel(newTotalPoints),
                  levelProgress: calculateLevelProgress(newTotalPoints),
                  nextLevelPoints: getNextLevelThreshold(newTotalPoints),
                  updatedAt: new Date(),
                })
                .where(eq(userPointsSummary.userId, userId))
            }
          }

          // 解锁下一关
          const nextLevel = await tx
            .select()
            .from(gamificationLevels)
            .where(and(
              eq(gamificationLevels.orderIndex, (levelData.orderIndex || 0) + 1),
              eq(gamificationLevels.isActive, true)
            ))
            .limit(1)

          if (nextLevel.length > 0) {
            const existingNextProgress = await tx
              .select()
              .from(userLevelProgress)
              .where(and(
                eq(userLevelProgress.userId, userId),
                eq(userLevelProgress.levelId, nextLevel[0].id)
              ))
              .limit(1)

            if (existingNextProgress.length === 0) {
              await tx.insert(userLevelProgress).values({
                userId: userId,
                levelId: nextLevel[0].id,
                status: 'unlocked',
                attempts: 0,
                bestScore: 0,
                totalScore: 0,
              })
            } else {
              await tx
                .update(userLevelProgress)
                .set({
                  status: 'unlocked',
                  updatedAt: new Date(),
                })
                .where(eq(userLevelProgress.id, existingNextProgress[0].id))
            }
          }

          // 检查成就
          await AchievementSystem.checkAndGrantAchievements(userId, {
            type: 'level_complete',
            data: { levelId, score }
          })
        }
      })

      return NextResponse.json({
        success: true,
        message: passed ? '恭喜通关！' : '挑战失败，继续努力！',
        data: {
          passed,
          score,
          bestScore: newBestScore,
          attempts: newAttempts,
          maxAttempts: levelData.maxAttempts || 3,
          rewards: passed ? levelData.rewards : null,
          canRetry: !passed && newAttempts < (levelData.maxAttempts || 3),
        }
      })
    } else {
      return NextResponse.json(
        { success: false, message: '无效的操作' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('关卡挑战失败:', error)
    return NextResponse.json(
      { success: false, message: '关卡挑战失败' },
      { status: 500 }
    )
  }
}

// 计算分数的简化逻辑
function calculateScore(submissionData: any, requirements: any): number {
  // 这里应该根据具体的关卡类型和要求来计算分数
  // 简化处理，返回一个基于提交数据的分数
  
  if (!submissionData || !submissionData.content) {
    return 0
  }

  let score = 50 // 基础分

  // 根据内容长度给分
  const content = submissionData.content
  if (content.length >= (requirements?.minWords || 5)) {
    score += 20
  }

  // 根据是否包含必需元素给分
  if (requirements?.mustInclude) {
    const includeCount = requirements.mustInclude.filter((word: string) => 
      content.includes(word)
    ).length
    score += (includeCount / requirements.mustInclude.length) * 30
  }

  return Math.min(100, Math.max(0, score))
}

// 检查成就
async function checkAchievements(tx: any, userId: string) {
  // 这个函数已被 AchievementSystem.checkAndGrantAchievements 替代
  // 保留这里是为了向后兼容，实际逻辑已移至 AchievementSystem
}