import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'

export interface SuccessLoginConfig {
  maxLoginsPerMinute: number // 每分钟最大登录次数
  maxLoginsPerHour: number // 每小时最大登录次数
  warningThreshold: number // 警告阈值
  lockoutThreshold: number // 锁定阈值
  timeWindow: number // 时间窗口（毫秒）
}

// 默认配置：每分钟最多3次，每小时最多10次
export const DEFAULT_SUCCESS_LOGIN_CONFIG: SuccessLoginConfig = {
  maxLoginsPerMinute: 3,
  maxLoginsPerHour: 10,
  warningThreshold: 2, // 每分钟2次时发出警告
  lockoutThreshold: 5, // 每分钟5次时锁定
  timeWindow: 60 * 1000, // 1分钟窗口
}

export interface SuccessLoginResult {
  allowed: boolean
  warning?: string
  lockout?: boolean
  remainingLogins?: number
  resetTime?: Date
}

/**
 * 检查频繁成功登录
 */
export async function checkFrequentSuccessLogin(email: string, user?: any): Promise<SuccessLoginResult> {
  try {
    // 如果没有传入用户对象，则查询数据库
    let userData = user
    if (!userData) {
      userData = await db.query.users.findFirst({
        where: eq(users.email, email),
      })
    }

    if (!userData) {
      return { allowed: true }
    }

    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // 检查最近1分钟内的登录次数
    const recentLogins = userData.recentSuccessfulLogins || 0
    const lastLoginTime = userData.lastSuccessfulLoginAt

    // 如果最后登录时间超过1分钟，重置计数
    if (!lastLoginTime || lastLoginTime < oneMinuteAgo) {
      return { allowed: true }
    }

    // 检查是否超过限制
    if (recentLogins >= DEFAULT_SUCCESS_LOGIN_CONFIG.lockoutThreshold) {
      // 锁定账户
      await lockAccountForFrequentLogin(email)
      
      await logger.warning({
        module: 'auth',
        action: 'frequent_success_login_lockout',
        description: `账户因频繁成功登录被锁定 (${email}): ${recentLogins}次/分钟`,
      })

      return {
        allowed: false,
        lockout: true,
        warning: `检测到异常频繁登录，账户已被临时锁定。请等待5分钟后重试。`
      }
    }

    if (recentLogins >= DEFAULT_SUCCESS_LOGIN_CONFIG.warningThreshold) {
      // 发出警告
      if (!user.loginFrequencyWarning) {
        await logger.warning({
          module: 'auth',
          action: 'frequent_success_login_warning',
          description: `检测到频繁成功登录 (${email}): ${recentLogins}次/分钟`,
        })

        // 标记已发出警告
        await db.update(users)
          .set({
            loginFrequencyWarning: true,
            updated_at: now
          })
          .where(eq(users.email, email))
      }

      return {
        allowed: true,
        warning: `检测到频繁登录，请确认是您本人在操作。如果继续频繁登录，账户将被临时锁定。`,
        remainingLogins: DEFAULT_SUCCESS_LOGIN_CONFIG.lockoutThreshold - recentLogins
      }
    }

    return {
      allowed: true,
      remainingLogins: DEFAULT_SUCCESS_LOGIN_CONFIG.lockoutThreshold - recentLogins
    }

  } catch (error) {
    console.error('检查频繁成功登录时出错:', error)
    // 出错时允许登录，避免影响正常用户
    return { allowed: true }
  }
}

/**
 * 记录成功登录
 */
export async function recordSuccessLogin(email: string, user?: any): Promise<void> {
  try {
    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)

    // 如果没有传入用户对象，则查询数据库
    let userData = user
    if (!userData) {
      userData = await db.query.users.findFirst({
        where: eq(users.email, email),
      })
    }

    if (!userData) {
      return
    }

    const lastLoginTime = userData.lastSuccessfulLoginAt
    let newLoginCount = 1

    // 如果最后登录时间在1分钟内，增加计数
    if (lastLoginTime && lastLoginTime >= oneMinuteAgo) {
      newLoginCount = (userData.recentSuccessfulLogins || 0) + 1
    }

    await db.update(users)
      .set({
        recentSuccessfulLogins: newLoginCount,
        lastSuccessfulLoginAt: now,
        updated_at: now
      })
      .where(eq(users.email, email))

  } catch (error) {
    console.error('记录成功登录时出错:', error)
  }
}

/**
 * 因频繁成功登录锁定账户
 */
async function lockAccountForFrequentLogin(email: string): Promise<void> {
  try {
    const now = new Date()
    const lockExpiresAt = new Date(now.getTime() + 5 * 60 * 1000) // 锁定5分钟

    await db.update(users)
      .set({
        isLocked: true,
        lockReason: '频繁成功登录',
        lockedAt: now,
        lockExpiresAt,
        recentSuccessfulLogins: 0, // 重置计数
        loginFrequencyWarning: false,
        updated_at: now
      })
      .where(eq(users.email, email))

  } catch (error) {
    console.error('锁定频繁登录账户时出错:', error)
  }
}

/**
 * 重置登录频率警告
 */
export async function resetLoginFrequencyWarning(email: string): Promise<void> {
  try {
    const now = new Date()
    await db.update(users)
      .set({
        loginFrequencyWarning: false,
        updated_at: now
      })
      .where(eq(users.email, email))
  } catch (error) {
    console.error('重置登录频率警告时出错:', error)
  }
}

/**
 * 清理过期的登录计数
 */
export async function cleanupExpiredLoginCounts(): Promise<void> {
  try {
    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)

    await db.update(users)
      .set({
        recentSuccessfulLogins: 0,
        loginFrequencyWarning: false,
        updated_at: now
      })
      .where(
        eq(users.lastSuccessfulLoginAt, oneMinuteAgo)
      )
  } catch (error) {
    console.error('清理过期登录计数时出错:', error)
  }
}

/**
 * 获取用户登录频率统计
 */
export async function getLoginFrequencyStats(email: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      return null
    }

    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
    const lastLoginTime = user.lastSuccessfulLoginAt

    return {
      recentSuccessfulLogins: user.recentSuccessfulLogins || 0,
      lastSuccessfulLoginAt: lastLoginTime,
      isWithinTimeWindow: lastLoginTime ? lastLoginTime >= oneMinuteAgo : false,
      hasWarning: user.loginFrequencyWarning || false,
      remainingLogins: DEFAULT_SUCCESS_LOGIN_CONFIG.lockoutThreshold - (user.recentSuccessfulLogins || 0)
    }
  } catch (error) {
    console.error('获取登录频率统计时出错:', error)
    return null
  }
}
