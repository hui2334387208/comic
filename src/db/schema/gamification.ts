import {
  serial,
  timestamp,
  varchar,
  integer,
  boolean,
  pgTable,
  text,
  jsonb,
  decimal,
  date,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

import { users } from './users'
import { couplets } from './couplet'

// 游戏化关卡表
export const gamificationLevels = pgTable('gamification_levels', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // 关卡名称
  description: text('description'), // 关卡描述
  difficulty: varchar('difficulty', { length: 20 }).notNull().default('easy'), // easy, medium, hard, expert
  levelType: varchar('level_type', { length: 30 }).notNull().default('couplet_creation'), // couplet_creation, rhyme_matching, theme_challenge
  requirements: jsonb('requirements'), // 通关要求 JSON
  rewards: jsonb('rewards'), // 奖励设置 JSON
  unlockConditions: jsonb('unlock_conditions'), // 解锁条件 JSON
  orderIndex: integer('order_index').default(0), // 关卡顺序
  isActive: boolean('is_active').notNull().default(true),
  maxAttempts: integer('max_attempts').default(3), // 最大尝试次数
  timeLimit: integer('time_limit').default(1800), // 时间限制（秒）
  passingScore: integer('passing_score').default(60), // 及格分数
  language: varchar('language', { length: 10 }).notNull().default('zh'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 用户关卡进度表
export const userLevelProgress = pgTable('user_level_progress', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  levelId: integer('level_id').notNull().references(() => gamificationLevels.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('locked'), // locked, unlocked, in_progress, completed, failed
  attempts: integer('attempts').default(0), // 已尝试次数
  bestScore: integer('best_score').default(0), // 最佳分数
  totalScore: integer('total_score').default(0), // 总分数
  completedAt: timestamp('completed_at'), // 完成时间
  lastAttemptAt: timestamp('last_attempt_at'), // 最后尝试时间
  timeSpent: integer('time_spent').default(0), // 花费时间（秒）
  submissionData: jsonb('submission_data'), // 提交数据
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 积分系统表
export const userPoints = pgTable('user_points', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  pointType: varchar('point_type', { length: 30 }).notNull(), // daily_signin, level_complete, couplet_create, like_received, comment_made
  points: integer('points').notNull(), // 积分数量
  source: varchar('source', { length: 50 }), // 积分来源
  sourceId: integer('source_id'), // 来源ID（如关卡ID、对联ID等）
  description: text('description'), // 积分描述
  multiplier: decimal('multiplier', { precision: 3, scale: 2 }).default('1.00'), // 积分倍数
  expiresAt: timestamp('expires_at'), // 积分过期时间
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 用户积分汇总表
export const userPointsSummary = pgTable('user_points_summary', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  totalPoints: integer('total_points').default(0), // 总积分
  availablePoints: integer('available_points').default(0), // 可用积分
  usedPoints: integer('used_points').default(0), // 已使用积分
  expiredPoints: integer('expired_points').default(0), // 已过期积分
  level: integer('level').default(1), // 用户等级
  levelProgress: integer('level_progress').default(0), // 当前等级进度
  nextLevelPoints: integer('next_level_points').default(100), // 下一等级所需积分
  streak: integer('streak').default(0), // 连续签到天数
  longestStreak: integer('longest_streak').default(0), // 最长连续签到
  lastSigninAt: date('last_signin_at'), // 最后签到日期
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 每日签到表
export const dailySignins = pgTable('daily_signins', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  signinDate: date('signin_date').notNull(), // 签到日期
  points: integer('points').default(10), // 签到获得积分
  streak: integer('streak').default(1), // 连续签到天数
  bonusPoints: integer('bonus_points').default(0), // 奖励积分
  bonusReason: varchar('bonus_reason', { length: 100 }), // 奖励原因
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 排行榜表
export const leaderboards = pgTable('leaderboards', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // 排行榜名称
  type: varchar('type', { length: 30 }).notNull(), // points, level_completion, creation_quality, activity
  description: text('description'), // 排行榜描述
  period: varchar('period', { length: 20 }).notNull().default('all_time'), // daily, weekly, monthly, all_time
  isActive: boolean('is_active').notNull().default(true),
  refreshInterval: integer('refresh_interval').default(3600), // 刷新间隔（秒）
  maxEntries: integer('max_entries').default(100), // 最大条目数
  lastRefreshAt: timestamp('last_refresh_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 排行榜条目表
export const leaderboardEntries = pgTable('leaderboard_entries', {
  id: serial('id').primaryKey(),
  leaderboardId: integer('leaderboard_id').notNull().references(() => leaderboards.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rank: integer('rank').notNull(), // 排名
  score: decimal('score', { precision: 10, scale: 2 }).notNull(), // 分数
  previousRank: integer('previous_rank'), // 上次排名
  rankChange: integer('rank_change').default(0), // 排名变化
  metadata: jsonb('metadata'), // 额外数据
  period: varchar('period', { length: 20 }).notNull(), // 对应的时间周期
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 限时挑战表
export const timedChallenges = pgTable('timed_challenges', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(), // 挑战标题
  description: text('description'), // 挑战描述
  theme: varchar('theme', { length: 255 }), // 挑战主题
  challengeType: varchar('challenge_type', { length: 30 }).notNull().default('theme_creation'), // theme_creation, speed_challenge, quality_contest
  difficulty: varchar('difficulty', { length: 20 }).notNull().default('medium'),
  status: varchar('status', { length: 20 }).notNull().default('upcoming'), // upcoming, active, ended, cancelled
  startTime: timestamp('start_time').notNull(), // 开始时间
  endTime: timestamp('end_time').notNull(), // 结束时间
  maxParticipants: integer('max_participants'), // 最大参与人数
  currentParticipants: integer('current_participants').default(0), // 当前参与人数
  requirements: jsonb('requirements'), // 参与要求
  rewards: jsonb('rewards'), // 奖励设置
  rules: jsonb('rules'), // 挑战规则
  judgeType: varchar('judge_type', { length: 20 }).notNull().default('auto'), // auto, manual, community
  isPublic: boolean('is_public').notNull().default(true),
  language: varchar('language', { length: 10 }).notNull().default('zh'),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 挑战参与表
export const challengeParticipations = pgTable('challenge_participations', {
  id: serial('id').primaryKey(),
  challengeId: integer('challenge_id').notNull().references(() => timedChallenges.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  coupletId: integer('couplet_id').references(() => couplets.id, { onDelete: 'set null' }), // 提交的对联
  submissionTime: timestamp('submission_time'), // 提交时间
  score: decimal('score', { precision: 5, scale: 2 }).default('0.00'), // 得分
  rank: integer('rank'), // 排名
  status: varchar('status', { length: 20 }).notNull().default('registered'), // registered, submitted, judged, disqualified
  judgeNotes: text('judge_notes'), // 评审备注
  metadata: jsonb('metadata'), // 额外数据
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 成就系统表
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // 成就名称
  description: text('description'), // 成就描述
  icon: varchar('icon', { length: 100 }), // 成就图标
  category: varchar('category', { length: 30 }).notNull().default('general'), // general, creation, social, challenge, streak
  type: varchar('type', { length: 20 }).notNull().default('count'), // count, streak, score, time
  condition: jsonb('condition'), // 达成条件
  rewards: jsonb('rewards'), // 奖励
  rarity: varchar('rarity', { length: 20 }).notNull().default('common'), // common, rare, epic, legendary
  isHidden: boolean('is_hidden').notNull().default(false), // 是否隐藏成就
  isActive: boolean('is_active').notNull().default(true),
  orderIndex: integer('order_index').default(0),
  language: varchar('language', { length: 10 }).notNull().default('zh'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 用户成就表
export const userAchievements = pgTable('user_achievements', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievementId: integer('achievement_id').notNull().references(() => achievements.id, { onDelete: 'cascade' }),
  progress: integer('progress').default(0), // 当前进度
  maxProgress: integer('max_progress').default(1), // 最大进度
  isCompleted: boolean('is_completed').notNull().default(false), // 是否完成
  completedAt: timestamp('completed_at'), // 完成时间
  notified: boolean('notified').notNull().default(false), // 是否已通知
  metadata: jsonb('metadata'), // 额外数据
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 徽章系统表
export const badges = pgTable('badges', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // 徽章名称
  description: text('description'), // 徽章描述
  icon: varchar('icon', { length: 100 }), // 徽章图标
  color: varchar('color', { length: 20 }), // 徽章颜色
  category: varchar('category', { length: 30 }).notNull().default('general'),
  rarity: varchar('rarity', { length: 20 }).notNull().default('common'),
  condition: jsonb('condition'), // 获得条件
  isActive: boolean('is_active').notNull().default(true),
  orderIndex: integer('order_index').default(0),
  language: varchar('language', { length: 10 }).notNull().default('zh'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 用户徽章表
export const userBadges = pgTable('user_badges', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  badgeId: integer('badge_id').notNull().references(() => badges.id, { onDelete: 'cascade' }),
  earnedAt: timestamp('earned_at').defaultNow().notNull(),
  isDisplayed: boolean('is_displayed').notNull().default(true), // 是否在个人资料中显示
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 关系定义
export const gamificationRelations = relations(gamificationLevels, ({ many }) => ({
  userProgress: many(userLevelProgress),
}))

export const userLevelProgressRelations = relations(userLevelProgress, ({ one }) => ({
  user: one(users, {
    fields: [userLevelProgress.userId],
    references: [users.id],
  }),
  level: one(gamificationLevels, {
    fields: [userLevelProgress.levelId],
    references: [gamificationLevels.id],
  }),
}))

export const userPointsRelations = relations(userPoints, ({ one }) => ({
  user: one(users, {
    fields: [userPoints.userId],
    references: [users.id],
  }),
}))

export const userPointsSummaryRelations = relations(userPointsSummary, ({ one }) => ({
  user: one(users, {
    fields: [userPointsSummary.userId],
    references: [users.id],
  }),
}))

export const dailySigninsRelations = relations(dailySignins, ({ one }) => ({
  user: one(users, {
    fields: [dailySignins.userId],
    references: [users.id],
  }),
}))

export const leaderboardEntriesRelations = relations(leaderboardEntries, ({ one }) => ({
  user: one(users, {
    fields: [leaderboardEntries.userId],
    references: [users.id],
  }),
  leaderboard: one(leaderboards, {
    fields: [leaderboardEntries.leaderboardId],
    references: [leaderboards.id],
  }),
}))

export const challengeParticipationsRelations = relations(challengeParticipations, ({ one }) => ({
  user: one(users, {
    fields: [challengeParticipations.userId],
    references: [users.id],
  }),
  challenge: one(timedChallenges, {
    fields: [challengeParticipations.challengeId],
    references: [timedChallenges.id],
  }),
  couplet: one(couplets, {
    fields: [challengeParticipations.coupletId],
    references: [couplets.id],
  }),
}))

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}))

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}))