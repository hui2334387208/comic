import { db } from '@/db'
import { userPoints, pointTransactions, userCheckIns, pointExchangeHistory } from '@/db/schema'
import { eq, sql, and, desc } from 'drizzle-orm'
import { rechargeCredits } from './credits-utils'

/**
 * 获取用户积分余额
 */
export async function getUserPoints(userId: string) {
  const [points] = await db
    .select()
    .from(userPoints)
    .where(eq(userPoints.userId, userId))
    .limit(1)

  if (!points) {
    // 如果用户没有记录，创建一个初始记录
    const [newPoints] = await db
      .insert(userPoints)
      .values({
        userId,
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
      })
      .returning()
    return newPoints
  }

  return points
}

/**
 * 增加积分
 */
export async function addPoints(
  userId: string,
  amount: number,
  source: 'checkin' | 'task' | 'exchange' | 'admin' | 'referral',
  relatedId?: number,
  relatedType?: string,
  description?: string,
  operatorId?: string
): Promise<{ success: boolean; message: string; balance: number }> {
  try {
    const points = await getUserPoints(userId)

    const balanceBefore = points.balance
    const balanceAfter = balanceBefore + amount

    // 使用事务保证原子性
    await db.transaction(async (tx) => {
      // 更新余额
      await tx
        .update(userPoints)
        .set({
          balance: balanceAfter,
          totalEarned: sql`${userPoints.totalEarned} + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(userPoints.userId, userId))

      // 记录交易
      await tx.insert(pointTransactions).values({
        userId,
        type: 'earn',
        amount,
        balanceBefore,
        balanceAfter,
        source,
        relatedId,
        relatedType,
        description: description || `获得${amount}积分`,
        operatorId,
      })
    })

    return {
      success: true,
      message: `成功获得${amount}积分`,
      balance: balanceAfter,
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || '获得积分失败',
      balance: 0,
    }
  }
}

/**
 * 消费积分
 */
export async function spendPoints(
  userId: string,
  amount: number,
  source: 'exchange' | 'admin',
  relatedId?: number,
  relatedType?: string,
  description?: string,
  operatorId?: string
): Promise<{ success: boolean; message: string; balance: number }> {
  try {
    const points = await getUserPoints(userId)

    if (points.balance < amount) {
      return {
        success: false,
        message: `积分不足，当前余额：${points.balance}积分，需要：${amount}积分`,
        balance: points.balance,
      }
    }

    const balanceBefore = points.balance
    const balanceAfter = balanceBefore - amount

    // 使用事务保证原子性
    await db.transaction(async (tx) => {
      // 更新余额
      await tx
        .update(userPoints)
        .set({
          balance: balanceAfter,
          totalSpent: sql`${userPoints.totalSpent} + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(userPoints.userId, userId))

      // 记录交易
      await tx.insert(pointTransactions).values({
        userId,
        type: 'spend',
        amount: -amount,
        balanceBefore,
        balanceAfter,
        source,
        relatedId,
        relatedType,
        description: description || `消费${amount}积分`,
        operatorId,
      })
    })

    return {
      success: true,
      message: `成功消费${amount}积分`,
      balance: balanceAfter,
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || '消费积分失败',
      balance: 0,
    }
  }
}

/**
 * 每日签到
 */
export async function dailyCheckIn(userId: string): Promise<{
  success: boolean
  message: string
  points?: number
  consecutiveDays?: number
  balance?: number
}> {
  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // 检查今天是否已签到
    const [existingCheckIn] = await db
      .select()
      .from(userCheckIns)
      .where(
        and(
          eq(userCheckIns.userId, userId),
          eq(userCheckIns.checkInDate, today)
        )
      )
      .limit(1)

    if (existingCheckIn) {
      return {
        success: false,
        message: '今天已经签到过了',
      }
    }

    // 查询昨天的签到记录
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const [yesterdayCheckIn] = await db
      .select()
      .from(userCheckIns)
      .where(
        and(
          eq(userCheckIns.userId, userId),
          eq(userCheckIns.checkInDate, yesterdayStr)
        )
      )
      .limit(1)

    // 计算连续签到天数
    const consecutiveDays = yesterdayCheckIn ? yesterdayCheckIn.consecutiveDays + 1 : 1

    // 根据连续签到天数计算积分奖励
    let pointsReward = 10 // 基础奖励10积分
    if (consecutiveDays >= 30) {
      pointsReward = 100 // 连续30天奖励100积分
    } else if (consecutiveDays >= 14) {
      pointsReward = 50 // 连续14天奖励50积分
    } else if (consecutiveDays >= 7) {
      pointsReward = 30 // 连续7天奖励30积分
    } else if (consecutiveDays >= 3) {
      pointsReward = 20 // 连续3天奖励20积分
    }

    // 创建签到记录
    const [checkIn] = await db
      .insert(userCheckIns)
      .values({
        userId,
        checkInDate: today,
        points: pointsReward,
        consecutiveDays,
      })
      .returning()

    // 增加用户积分
    const addResult = await addPoints(
      userId,
      pointsReward,
      'checkin',
      checkIn.id,
      'daily_checkin',
      `每日签到奖励${pointsReward}积分（连续${consecutiveDays}天）`
    )

    if (!addResult.success) {
      // 如果增加积分失败，删除签到记录
      await db
        .delete(userCheckIns)
        .where(eq(userCheckIns.id, checkIn.id))

      return {
        success: false,
        message: '签到失败，请稍后重试',
      }
    }

    return {
      success: true,
      message: `签到成功！获得${pointsReward}积分（连续签到${consecutiveDays}天）`,
      points: pointsReward,
      consecutiveDays,
      balance: addResult.balance,
    }
  } catch (error: any) {
    console.error('签到失败:', error)
    return {
      success: false,
      message: '签到失败',
    }
  }
}

/**
 * 获取签到状态
 */
export async function getCheckInStatus(userId: string) {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // 查询今天是否已签到
  const [todayCheckIn] = await db
    .select()
    .from(userCheckIns)
    .where(
      and(
        eq(userCheckIns.userId, userId),
        eq(userCheckIns.checkInDate, today)
      )
    )
    .limit(1)

  // 查询最近的签到记录（用于计算连续签到天数）
  const recentCheckIns = await db
    .select()
    .from(userCheckIns)
    .where(eq(userCheckIns.userId, userId))
    .orderBy(desc(userCheckIns.checkInDate))
    .limit(30)

  // 查询本月签到记录
  const currentMonth = today.substring(0, 7) // YYYY-MM
  const monthCheckIns = await db
    .select()
    .from(userCheckIns)
    .where(
      and(
        eq(userCheckIns.userId, userId),
        sql`${userCheckIns.checkInDate} >= ${currentMonth + '-01'}`
      )
    )
    .orderBy(desc(userCheckIns.checkInDate))

  // 计算连续签到天数
  let consecutiveDays = 0
  if (recentCheckIns.length > 0) {
    const dates = recentCheckIns.map(r => r.checkInDate).sort().reverse()
    consecutiveDays = 1

    for (let i = 0; i < dates.length - 1; i++) {
      const current = new Date(dates[i])
      const next = new Date(dates[i + 1])
      const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        consecutiveDays++
      } else {
        break
      }
    }
  }

  return {
    hasCheckedInToday: !!todayCheckIn,
    todayCheckIn: todayCheckIn || null,
    consecutiveDays,
    monthCheckInDays: monthCheckIns.length,
    recentCheckIns: recentCheckIns.slice(0, 7), // 最近7天
  }
}

/**
 * 积分兑换次数
 * @param exchangeRate 兑换比例（多少积分兑换1次数）
 */
export async function exchangePointsForCredits(
  userId: string,
  credits: number,
  exchangeRate: number = 100 // 默认100积分兑换1次数
): Promise<{
  success: boolean
  message: string
  pointsSpent?: number
  creditsReceived?: number
  pointBalance?: number
  creditBalance?: number
}> {
  try {
    if (credits <= 0) {
      return {
        success: false,
        message: '兑换次数必须大于0',
      }
    }

    const pointsNeeded = credits * exchangeRate

    // 检查积分余额
    const points = await getUserPoints(userId)
    if (points.balance < pointsNeeded) {
      return {
        success: false,
        message: `积分不足，需要${pointsNeeded}积分，当前余额：${points.balance}积分`,
      }
    }

    // 使用事务保证原子性
    let pointBalance = 0
    let creditBalance = 0

    await db.transaction(async (tx) => {
      // 1. 消费积分
      const spendResult = await spendPoints(
        userId,
        pointsNeeded,
        'exchange',
        undefined,
        'exchange_credits',
        `兑换${credits}次数，消费${pointsNeeded}积分`
      )

      if (!spendResult.success) {
        throw new Error(spendResult.message)
      }

      pointBalance = spendResult.balance

      // 2. 增加次数
      const rechargeResult = await rechargeCredits(
        userId,
        credits,
        undefined,
        'point_exchange',
        `积分兑换${credits}次数`
      )

      if (!rechargeResult.success) {
        throw new Error(rechargeResult.message)
      }

      creditBalance = rechargeResult.balance

      // 3. 记录兑换历史
      await tx.insert(pointExchangeHistory).values({
        userId,
        pointsSpent: pointsNeeded,
        creditsReceived: credits,
        exchangeRate,
      })
    })

    return {
      success: true,
      message: `成功兑换${credits}次数，消费${pointsNeeded}积分`,
      pointsSpent: pointsNeeded,
      creditsReceived: credits,
      pointBalance,
      creditBalance,
    }
  } catch (error: any) {
    console.error('兑换失败:', error)
    return {
      success: false,
      message: error.message || '兑换失败',
    }
  }
}

/**
 * 获取积分兑换历史
 */
export async function getExchangeHistory(userId: string, limit: number = 10) {
  return await db
    .select()
    .from(pointExchangeHistory)
    .where(eq(pointExchangeHistory.userId, userId))
    .orderBy(desc(pointExchangeHistory.createdAt))
    .limit(limit)
}

/**
 * 获取积分交易记录
 */
export async function getPointTransactions(userId: string, limit: number = 20) {
  return await db
    .select()
    .from(pointTransactions)
    .where(eq(pointTransactions.userId, userId))
    .orderBy(desc(pointTransactions.createdAt))
    .limit(limit)
}
