import { relations } from 'drizzle-orm'
import {
  pgTable, serial, timestamp, varchar, text,
  integer, uuid,
} from 'drizzle-orm/pg-core'

import { users } from './users'

// 用户次数余额表
export const userCredits = pgTable('user_credits', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  balance: integer('balance').notNull().default(0), // 剩余次数
  totalRecharged: integer('total_recharged').notNull().default(0), // 累计充值次数
  totalConsumed: integer('total_consumed').notNull().default(0), // 累计消费次数
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 次数兑换码表
export const creditRedeemCodes = pgTable('credit_redeem_codes', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(), // 兑换码
  credits: integer('credits').notNull(), // 可兑换的次数
  maxUses: integer('max_uses').default(1), // 最大使用次数
  usedCount: integer('used_count').default(0), // 已使用次数
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, inactive, expired, used_up
  expiresAt: timestamp('expires_at'), // 过期时间
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }), // 创建人
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 次数兑换记录表
export const creditRedeemHistory = pgTable('credit_redeem_history', {
  id: serial('id').primaryKey(),
  codeId: integer('code_id').notNull().references(() => creditRedeemCodes.id, { onDelete: 'restrict' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  credits: integer('credits').notNull(), // 兑换获得的次数
  status: varchar('status', { length: 20 }).notNull(), // success, failed
  message: text('message'), // 失败原因或备注
  redeemedAt: timestamp('redeemed_at').defaultNow().notNull(),
})

// 次数交易记录表
export const creditTransactions = pgTable('credit_transactions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(), // recharge(充值), consume(消费), refund(退款), gift(赠送), admin_adjust(管理员调整)
  amount: integer('amount').notNull(), // 变动数量（正数为增加，负数为减少）
  balanceBefore: integer('balance_before').notNull(), // 变动前余额
  balanceAfter: integer('balance_after').notNull(), // 变动后余额
  relatedId: integer('related_id'), // 关联ID（如兑换码ID、漫画ID等）
  relatedType: varchar('related_type', { length: 50 }), // 关联类型（redeem_code, comic_generation等）
  description: text('description'), // 描述
  operatorId: text('operator_id').references(() => users.id, { onDelete: 'set null' }), // 操作人（管理员调整时使用）
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Relations
export const userCreditsRelations = relations(userCredits, ({ one }) => ({
  user: one(users, {
    fields: [userCredits.userId],
    references: [users.id],
  }),
}))

export const creditRedeemCodesRelations = relations(creditRedeemCodes, ({ one, many }) => ({
  creator: one(users, {
    fields: [creditRedeemCodes.createdBy],
    references: [users.id],
  }),
  history: many(creditRedeemHistory),
}))

export const creditRedeemHistoryRelations = relations(creditRedeemHistory, ({ one }) => ({
  redeemCode: one(creditRedeemCodes, {
    fields: [creditRedeemHistory.codeId],
    references: [creditRedeemCodes.id],
  }),
  user: one(users, {
    fields: [creditRedeemHistory.userId],
    references: [users.id],
  }),
}))

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
  operator: one(users, {
    fields: [creditTransactions.operatorId],
    references: [users.id],
  }),
}))
