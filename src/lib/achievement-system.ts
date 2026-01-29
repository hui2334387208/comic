import { eq, and, count, sum, desc } from 'drizzle-orm'
import { db } from '@/db'
import { 
  achievements, 
  userAchievements, 
  userLevelProgress,
  userPoints,
  userPointsSummary,
  dailySignins,
  couplets,
  coupletLikes
} from '@/db/schema'

// 成就检查和授予系统
export class AchievementSystem {
  
  // 检查并授予所有可能的成就
  static async checkAndGrantAchievements(userId: string, context?: {
    type?: 'level_complete' | 'signin' | 'couplet_create' | 'like_received'
    data?: any
  }) {
    try {
      const grantedAchievements = []

      // 获取所有活跃成就
      const allAchievements = await db
        .select()
        .from(achievements)
        .where(eq(achievements.isActive, true))

      // 获取用户已有成就
      const userExistingAchievements = await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId))

      const existingAchievementIds = new Set(
        userExistingAchievements.map(ua => ua.achievementId)
      )

      for (const achievement of allAchievements) {
        // 跳过已获得的成就
        if (existingAchievementIds.has(achievement.id)) {
          continue
        }

        const shouldGrant = await this.checkAchievementCondition(
          userId, 
          achievement, 
          context
        )

        if (shouldGrant) {
          await this.grantAchievement(userId, achievement)
          grantedAchievements.push(achievement)
        }
      }

      return grantedAchievements
    } catch (error) {
      console.error('检查成就失败:', error)
      return []
    }
  }

  // 检查单个成就条件
  private static async checkAchievementCondition(
    userId: string, 
    achievement: any, 
    context?: any
  ): Promise<boolean> {
    const condition = achievement.condition

    if (!condition || !condition.metric) {
      return false
    }

    try {
      switch (condition.metric) {
        case 'levels_completed':
          return await this.checkLevelsCompleted(userId, condition.target)
        
        case 'signin_streak':
          return await this.checkSigninStreak(userId, condition.target)
        
        case 'couplets_created':
          return await this.checkCoupletsCreated(userId, condition.target)
        
        case 'likes_received':
          return await this.checkLikesReceived(userId, condition.target)
        
        case 'total_points':
          return await this.checkTotalPoints(userId, condition.target)
        
        default:
          return false
      }
    } catch (error) {
      console.error(`检查成就条件失败 (${achievement.name}):`, error)
      return false
    }
  }

  // 检查完成关卡数
  private static async checkLevelsCompleted(userId: string, target: number): Promise<boolean> {
    const result = await db
      .select({ count: count() })
      .from(userLevelProgress)
      .where(and(
        eq(userLevelProgress.userId, userId),
        eq(userLevelProgress.status, 'completed')
      ))

    return (result[0]?.count || 0) >= target
  }

  // 检查连续签到天数
  private static async checkSigninStreak(userId: string, target: number): Promise<boolean> {
    const summary = await db
      .select()
      .from(userPointsSummary)
      .where(eq(userPointsSummary.userId, userId))
      .limit(1)

    return (summary[0]?.streak || 0) >= target
  }

  // 检查创作对联数
  private static async checkCoupletsCreated(userId: string, target: number): Promise<boolean> {
    const result = await db
      .select({ count: count() })
      .from(couplets)
      .where(eq(couplets.authorId, userId))

    return (result[0]?.count || 0) >= target
  }

  // 检查获得点赞数
  private static async checkLikesReceived(userId: string, target: number): Promise<boolean> {
    const result = await db
      .select({ count: count() })
      .from(coupletLikes)
      .innerJoin(couplets, eq(coupletLikes.coupletId, couplets.id))
      .where(eq(couplets.authorId, userId))

    return (result[0]?.count || 0) >= target
  }

  // 检查总积分
  private static async checkTotalPoints(userId: string, target: number): Promise<boolean> {
    const summary = await db
      .select()
      .from(userPointsSummary)
      .where(eq(userPointsSummary.userId, userId))
      .limit(1)

    return (summary[0]?.totalPoints || 0) >= target
  }

  // 授予成就
  private static async grantAchievement(userId: string, achievement: any) {
    await db.transaction(async (tx) => {
      // 创建用户成就记录
      await tx.insert(userAchievements).values({
        userId,
        achievementId: achievement.id,
        progress: achievement.condition?.target || 1,
        maxProgress: achievement.condition?.target || 1,
        isCompleted: true,
        completedAt: new Date(),
        notified: false,
      })

      // 如果有积分奖励，添加积分
      if (achievement.rewards?.points) {
        await tx.insert(userPoints).values({
          userId,
          pointType: 'achievement',
          points: achievement.rewards.points,
          source: 'achievement',
          sourceId: achievement.id,
          description: `获得成就：${achievement.name}`,
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
              totalPoints: summary[0].totalPoints + achievement.rewards.points,
              availablePoints: summary[0].availablePoints + achievement.rewards.points,
              updatedAt: new Date(),
            })
            .where(eq(userPointsSummary.userId, userId))
        }
      }
    })

    console.log(`用户 ${userId} 获得成就: ${achievement.name}`)
  }

  // 获取用户未读成就通知
  static async getUnreadAchievements(userId: string) {
    return await db
      .select({
        achievement: achievements,
        userAchievement: userAchievements,
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.isCompleted, true),
        eq(userAchievements.notified, false)
      ))
  }

  // 标记成就通知为已读
  static async markAchievementsAsNotified(userId: string, achievementIds: number[]) {
    if (achievementIds.length === 0) return

    await db
      .update(userAchievements)
      .set({
        notified: true,
        updatedAt: new Date(),
      })
      .where(and(
        eq(userAchievements.userId, userId),
        // TODO: 添加 achievementId in achievementIds 的条件
      ))
  }

  // 获取用户成就统计
  static async getUserAchievementStats(userId: string) {
    const totalAchievements = await db
      .select({ count: count() })
      .from(achievements)
      .where(eq(achievements.isActive, true))

    const completedUserAchievements = await db
      .select({ count: count() })
      .from(userAchievements)
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.isCompleted, true)
      ))

    const recentAchievements = await db
      .select({
        achievement: achievements,
        userAchievement: userAchievements,
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.isCompleted, true)
      ))
      .orderBy(desc(userAchievements.completedAt))
      .limit(5)

    return {
      total: totalAchievements[0]?.count || 0,
      completed: completedUserAchievements[0]?.count || 0,
      completionRate: totalAchievements[0]?.count > 0 
        ? Math.round(((completedUserAchievements[0]?.count || 0) / totalAchievements[0].count) * 100)
        : 0,
      recent: recentAchievements,
    }
  }
}