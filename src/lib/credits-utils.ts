import { db } from '@/db'
import { userCredits, creditTransactions } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

/**
 * 获取用户次数余额
 */
export async function getUserCredits(userId: string) {
  const [credits] = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .limit(1)

  if (!credits) {
    // 如果用户没有记录，创建一个初始记录
    const [newCredits] = await db
      .insert(userCredits)
      .values({
        userId,
        balance: 0,
        totalRecharged: 0,
        totalConsumed: 0,
      })
      .returning()
    return newCredits
  }

  return credits
}

/**
 * 检查用户次数是否足够
 */
export async function checkCreditsBalance(userId: string, required: number): Promise<{
  sufficient: boolean
  balance: number
  required: number
  shortage: number
}> {
  const credits = await getUserCredits(userId)
  const sufficient = credits.balance >= required
  const shortage = sufficient ? 0 : required - credits.balance

  return {
    sufficient,
    balance: credits.balance,
    required,
    shortage,
  }
}

/**
 * 消费次数
 */
export async function consumeCredits(
  userId: string,
  amount: number,
  relatedId?: number,
  relatedType?: string,
  description?: string
): Promise<{ success: boolean; message: string; balance: number }> {
  try {
    const credits = await getUserCredits(userId)

    if (credits.balance < amount) {
      return {
        success: false,
        message: `次数不足，当前余额：${credits.balance}次，需要：${amount}次`,
        balance: credits.balance,
      }
    }

    const balanceBefore = credits.balance
    const balanceAfter = balanceBefore - amount

    // 使用事务保证原子性
    await db.transaction(async (tx) => {
      // 更新余额
      await tx
        .update(userCredits)
        .set({
          balance: balanceAfter,
          totalConsumed: sql`${userCredits.totalConsumed} + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId))

      // 记录交易
      await tx.insert(creditTransactions).values({
        userId,
        type: 'consume',
        amount: -amount,
        balanceBefore,
        balanceAfter,
        relatedId,
        relatedType,
        description: description || `消费${amount}次`,
      })
    })

    return {
      success: true,
      message: `成功消费${amount}次`,
      balance: balanceAfter,
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || '消费失败',
      balance: 0,
    }
  }
}

/**
 * 充值次数
 */
export async function rechargeCredits(
  userId: string,
  amount: number,
  relatedId?: number,
  relatedType?: string,
  description?: string,
  operatorId?: string
): Promise<{ success: boolean; message: string; balance: number }> {
  try {
    const credits = await getUserCredits(userId)

    const balanceBefore = credits.balance
    const balanceAfter = balanceBefore + amount

    // 使用事务保证原子性
    await db.transaction(async (tx) => {
      // 更新余额
      await tx
        .update(userCredits)
        .set({
          balance: balanceAfter,
          totalRecharged: sql`${userCredits.totalRecharged} + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId))

      // 记录交易
      await tx.insert(creditTransactions).values({
        userId,
        type: 'recharge',
        amount,
        balanceBefore,
        balanceAfter,
        relatedId,
        relatedType,
        description: description || `充值${amount}次`,
        operatorId,
      })
    })

    return {
      success: true,
      message: `成功充值${amount}次`,
      balance: balanceAfter,
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || '充值失败',
      balance: 0,
    }
  }
}

/**
 * 管理员调整次数
 */
export async function adjustCredits(
  userId: string,
  amount: number,
  operatorId: string,
  description: string
): Promise<{ success: boolean; message: string; balance: number }> {
  try {
    const credits = await getUserCredits(userId)

    const balanceBefore = credits.balance
    const balanceAfter = balanceBefore + amount

    if (balanceAfter < 0) {
      return {
        success: false,
        message: '调整后余额不能为负数',
        balance: balanceBefore,
      }
    }

    // 使用事务保证原子性
    await db.transaction(async (tx) => {
      // 更新余额
      await tx
        .update(userCredits)
        .set({
          balance: balanceAfter,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId))

      // 记录交易
      await tx.insert(creditTransactions).values({
        userId,
        type: 'admin_adjust',
        amount,
        balanceBefore,
        balanceAfter,
        description,
        operatorId,
      })
    })

    return {
      success: true,
      message: `成功调整${amount > 0 ? '+' : ''}${amount}次`,
      balance: balanceAfter,
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || '调整失败',
      balance: 0,
    }
  }
}
