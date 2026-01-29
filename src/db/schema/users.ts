import { pgTable, serial, timestamp, varchar, text, integer, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: varchar('image', { length: 255 }),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  avatar: varchar('avatar', { length: 255 }),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  profile: text('profile'), // 个人简介
  sysPrefs: text('sys_prefs'), // 系统偏好设置，JSON格式
  rewardPrefs: text('reward_prefs'), // 打赏偏好设置，JSON格式
  // 账户锁定相关字段
  isLocked: boolean('is_locked').notNull().default(false), // 账户是否被锁定
  lockReason: varchar('lock_reason', { length: 255 }), // 锁定原因
  lockedAt: timestamp('locked_at', { mode: 'date' }), // 锁定时间
  lockExpiresAt: timestamp('lock_expires_at', { mode: 'date' }), // 锁定过期时间
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0), // 连续失败登录次数
  lastFailedLoginAt: timestamp('last_failed_login_at', { mode: 'date' }), // 最后失败登录时间
  // 成功登录跟踪字段
  recentSuccessfulLogins: integer('recent_successful_logins').notNull().default(0), // 最近成功登录次数
  lastSuccessfulLoginAt: timestamp('last_successful_login_at', { mode: 'date' }), // 最后成功登录时间
  loginFrequencyWarning: boolean('login_frequency_warning').notNull().default(false), // 是否已发出频繁登录警告
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
})
