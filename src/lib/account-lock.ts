import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, and, lt } from 'drizzle-orm'

export interface AccountLockConfig {
  maxFailedAttempts: number // 最大失败尝试次数
  lockoutDuration: number // 锁定持续时间（毫秒）
  progressiveLockout: boolean // 是否启用渐进式锁定
  maxLockoutDuration: number // 最大锁定时间（毫秒）
}

// 默认配置：5次失败后锁定，渐进式增加锁定时间
export const DEFAULT_LOCK_CONFIG: AccountLockConfig = {
  maxFailedAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15分钟
  progressiveLockout: true,
  maxLockoutDuration: 24 * 60 * 60 * 1000, // 24小时
}

export interface LockResult {
  isLocked: boolean
  lockReason?: string
  lockExpiresAt?: Date
  remainingAttempts?: number
  unlockTime?: Date
}

/**
 * 检查账户是否被锁定
 */
export async function checkAccountLock(email: string, user?: any): Promise<LockResult> {
  try {
    // 如果没有传入用户对象，则查询数据库
    let userData = user
    if (!userData) {
      userData = await db.query.users.findFirst({
        where: eq(users.email, email),
      })
    }

    if (!userData) {
      return { isLocked: false }
    }

    // 如果账户未锁定，直接返回
    if (!userData.isLocked) {
      return { 
        isLocked: false,
        remainingAttempts: DEFAULT_LOCK_CONFIG.maxFailedAttempts - userData.failedLoginAttempts
      }
    }

    // 检查锁定是否已过期
    if (userData.lockExpiresAt && new Date() > userData.lockExpiresAt) {
      // 自动解锁账户
      await unlockAccount(email, '锁定时间已过期，自动解锁')
      return { isLocked: false }
    }

    // 账户仍被锁定
    return {
      isLocked: true,
      lockReason: user.lockReason || '频繁登录失败',
      lockExpiresAt: user.lockExpiresAt || undefined,
      unlockTime: user.lockExpiresAt || undefined
    }
  } catch (error) {
    console.error('检查账户锁定时出错:', error)
    // 出错时允许登录，避免影响正常用户
    return { isLocked: false }
  }
}

/**
 * 记录登录失败
 */
export async function recordLoginFailure(email: string, user?: any): Promise<LockResult> {
  try {
    // 如果没有传入用户对象，则查询数据库
    let userData = user
    if (!userData) {
      userData = await db.query.users.findFirst({
        where: eq(users.email, email),
      })
    }

    if (!userData) {
      return { isLocked: false }
    }

    const now = new Date()
    const newFailedAttempts = userData.failedLoginAttempts + 1

    // 检查是否需要锁定账户
    if (newFailedAttempts >= DEFAULT_LOCK_CONFIG.maxFailedAttempts) {
      const lockDuration = calculateLockDuration(newFailedAttempts)
      const lockExpiresAt = new Date(now.getTime() + lockDuration)

      await db.update(users)
        .set({
          isLocked: true,
          lockReason: '频繁登录失败',
          lockedAt: now,
          lockExpiresAt,
          failedLoginAttempts: newFailedAttempts,
          lastFailedLoginAt: now,
          updated_at: now
        })
        .where(eq(users.email, email))

      return {
        isLocked: true,
        lockReason: '频繁登录失败',
        lockExpiresAt,
        unlockTime: lockExpiresAt
      }
    } else {
      // 仅更新失败次数
      await db.update(users)
        .set({
          failedLoginAttempts: newFailedAttempts,
          lastFailedLoginAt: now,
          updated_at: now
        })
        .where(eq(users.email, email))

      return {
        isLocked: false,
        remainingAttempts: DEFAULT_LOCK_CONFIG.maxFailedAttempts - newFailedAttempts
      }
    }
  } catch (error) {
    console.error('记录登录失败时出错:', error)
    return { isLocked: false }
  }
}

/**
 * 记录登录成功，重置失败次数
 */
export async function recordLoginSuccess(email: string): Promise<void> {
  try {
    const now = new Date()
    await db.update(users)
      .set({
        isLocked: false,
        lockReason: null,
        lockedAt: null,
        lockExpiresAt: null,
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        updated_at: now
      })
      .where(eq(users.email, email))
  } catch (error) {
    console.error('记录登录成功时出错:', error)
  }
}

/**
 * 手动解锁账户
 */
export async function unlockAccount(email: string, reason: string = '管理员手动解锁'): Promise<void> {
  try {
    const now = new Date()
    await db.update(users)
      .set({
        isLocked: false,
        lockReason: null,
        lockedAt: null,
        lockExpiresAt: null,
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        updated_at: now
      })
      .where(eq(users.email, email))
  } catch (error) {
    console.error('解锁账户时出错:', error)
  }
}

/**
 * 计算锁定持续时间（渐进式锁定）
 */
function calculateLockDuration(failedAttempts: number): number {
  if (!DEFAULT_LOCK_CONFIG.progressiveLockout) {
    return DEFAULT_LOCK_CONFIG.lockoutDuration
  }

  // 渐进式锁定：失败次数越多，锁定时间越长
  const baseDuration = DEFAULT_LOCK_CONFIG.lockoutDuration
  const multiplier = Math.min(failedAttempts - DEFAULT_LOCK_CONFIG.maxFailedAttempts + 1, 10) // 最多10倍
  const duration = baseDuration * multiplier

  return Math.min(duration, DEFAULT_LOCK_CONFIG.maxLockoutDuration)
}

/**
 * 清理过期的锁定记录
 */
export async function cleanupExpiredLocks(): Promise<void> {
  try {
    const now = new Date()
    await db.update(users)
      .set({
        isLocked: false,
        lockReason: null,
        lockedAt: null,
        lockExpiresAt: null,
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        updated_at: now
      })
      .where(
        and(
          eq(users.isLocked, true),
          lt(users.lockExpiresAt, now)
        )
      )
  } catch (error) {
    console.error('清理过期锁定时出错:', error)
  }
}

/**
 * 获取账户锁定统计
 */
export async function getAccountLockStats(email: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      return null
    }

    return {
      isLocked: user.isLocked,
      lockReason: user.lockReason,
      lockedAt: user.lockedAt,
      lockExpiresAt: user.lockExpiresAt,
      failedLoginAttempts: user.failedLoginAttempts,
      lastFailedLoginAt: user.lastFailedLoginAt,
      remainingAttempts: DEFAULT_LOCK_CONFIG.maxFailedAttempts - user.failedLoginAttempts
    }
  } catch (error) {
    console.error('获取账户锁定统计时出错:', error)
    return null
  }
}
