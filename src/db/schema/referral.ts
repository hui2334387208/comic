import { relations } from 'drizzle-orm'
import {
  pgTable,
  serial,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from 'drizzle-orm/pg-core'

import { users } from './users'

// 用户邀请码表
export const userReferralCodes = pgTable('user_referral_codes', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  referralCode: varchar('referral_code', { length: 20 }).notNull().unique(), // 邀请码（唯一）
  totalInvites: integer('total_invites').notNull().default(0), // 总邀请人数
  successfulInvites: integer('successful_invites').notNull().default(0), // 成功邀请人数（完成任务的）
  totalRewards: integer('total_rewards').notNull().default(0), // 累计获得奖励次数
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 邀请关系表
export const referralRelations = pgTable('referral_relations', {
  id: serial('id').primaryKey(),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // 邀请人ID
  inviteeId: text('invitee_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }), // 被邀请人ID（一个用户只能被邀请一次）
  referralCode: varchar('referral_code', { length: 20 }).notNull(), // 使用的邀请码
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending: 待完成, completed: 已完成, expired: 已过期
  inviterRewarded: boolean('inviter_rewarded').notNull().default(false), // 邀请人是否已获得奖励
  inviteeRewarded: boolean('invitee_rewarded').notNull().default(false), // 被邀请人是否已获得奖励
  inviterRewardAmount: integer('inviter_reward_amount').default(0), // 邀请人获得的奖励次数
  inviteeRewardAmount: integer('invitee_reward_amount').default(0), // 被邀请人获得的奖励次数
  completedAt: timestamp('completed_at'), // 完成时间（被邀请人完成任务的时间）
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 邀请奖励记录表
export const referralRewards = pgTable('referral_rewards', {
  id: serial('id').primaryKey(),
  relationId: integer('relation_id')
    .notNull()
    .references(() => referralRelations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // 获得奖励的用户
  rewardType: varchar('reward_type', { length: 20 }).notNull(), // inviter: 邀请人奖励, invitee: 被邀请人奖励
  rewardAmount: integer('reward_amount').notNull(), // 奖励次数
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending: 待发放, issued: 已发放, failed: 发放失败
  issuedAt: timestamp('issued_at'), // 发放时间
  failReason: text('fail_reason'), // 失败原因
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 邀请活动配置表（可选，用于配置不同时期的邀请奖励规则）
export const referralCampaigns = pgTable('referral_campaigns', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // 活动名称
  description: text('description'), // 活动描述
  inviterReward: integer('inviter_reward').notNull().default(10), // 邀请人奖励次数
  inviteeReward: integer('invitee_reward').notNull().default(5), // 被邀请人奖励次数
  requirementType: varchar('requirement_type', { length: 50 }).notNull().default('register'), // register: 注册即可, first_comic: 首次创作, verified_email: 验证邮箱
  isActive: boolean('is_active').notNull().default(true), // 是否激活
  startDate: timestamp('start_date'), // 开始时间
  endDate: timestamp('end_date'), // 结束时间
  maxInvitesPerUser: integer('max_invites_per_user'), // 每个用户最多邀请人数（null表示无限制）
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Relations
export const userReferralCodesRelations = relations(
  userReferralCodes,
  ({ one }) => ({
    user: one(users, {
      fields: [userReferralCodes.userId],
      references: [users.id],
    }),
  })
)

export const referralRelationsRelations = relations(
  referralRelations,
  ({ one, many }) => ({
    inviter: one(users, {
      fields: [referralRelations.inviterId],
      references: [users.id],
      relationName: 'inviter',
    }),
    invitee: one(users, {
      fields: [referralRelations.inviteeId],
      references: [users.id],
      relationName: 'invitee',
    }),
    rewards: many(referralRewards),
  })
)

export const referralRewardsRelations = relations(referralRewards, ({ one }) => ({
  relation: one(referralRelations, {
    fields: [referralRewards.relationId],
    references: [referralRelations.id],
  }),
  user: one(users, {
    fields: [referralRewards.userId],
    references: [users.id],
  }),
}))
