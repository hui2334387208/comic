import { relations } from 'drizzle-orm'
import {
  pgTable, serial, timestamp, varchar, text,
  decimal, integer, boolean, uuid, jsonb,
} from 'drizzle-orm/pg-core'

import { users } from './users'

// VIP会员套餐表
export const vipPlans = pgTable('vip_plans', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal('original_price', { precision: 10, scale: 2 }),
  duration: integer('duration').notNull(), // 时长（月）
  features: jsonb('features'), // JSON格式存储功能列表，支持查询和索引
  status: boolean('status').default(true),
  sortOrder: integer('sort_order').default(0),
  operatorId: text('operator_id').references(() => users.id, { onDelete: 'set null' }), // 管理员删除时设为null，保留套餐
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// VIP订单表
export const vipOrders = pgTable('vip_orders', {
  id: serial('id').primaryKey(),
  orderNo: varchar('order_no', { length: 50 }).notNull().unique(), // 订单号
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }), // 用户ID 用户删除时删除订单
  planId: integer('plan_id').notNull().references(() => vipPlans.id, { onDelete: 'restrict' }), // 套餐ID 有订单时禁止删除套餐
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(), // 订单金额
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending: 待审核, in_review: 审核中, completed: 已通过, rejected: 已拒绝, cancelled: 已取消, refunded: 已退款
  paymentMethod: varchar('payment_method', { length: 50 }), // 支付方式
  paymentTransactionId: varchar('payment_transaction_id', { length: 100 }), // 支付网关交易号
  userSubmittedTransactionId: varchar('user_submitted_transaction_id', { length: 100 }), // 用户提交的交易凭证
  adminNotes: text('admin_notes'), // 管理员备注/拒绝原因
  autoRenew: boolean('auto_renew').default(false), // 是否自动续费
  paidAt: timestamp('paid_at'), // 支付时间
  expireAt: timestamp('expire_at'), // 到期时间
  reviewedBy: text('reviewed_by').references(() => users.id, { onDelete: 'set null' }), // 审核人
  reviewedAt: timestamp('reviewed_at'), // 审核时间
  createdAt: timestamp('created_at').defaultNow().notNull(), // 创建时间
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // 更新时间
})

// VIP兑换码表
export const vipRedeemCodes = pgTable('vip_redeem_codes', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(), // 兑换码
  type: varchar('type', { length: 20 }).notNull().default('plan'), // 兑换类型: plan(套餐), duration(月), days(天), level(等级)等
  planId: integer('plan_id').references(() => vipPlans.id, { onDelete: 'set null' }), // 关联套餐，可为空
  duration: integer('duration'), // 时长（月），可为空
  days: integer('days'), // 时长（天），可为空
  vipLevel: integer('vip_level'), // VIP等级，可为空
  maxUses: integer('max_uses').default(1), // 最大使用次数
  usedCount: integer('used_count').default(0), // 已使用次数
  status: varchar('status', { length: 20 }).notNull().default('active'),// active 可用 inactive 不可用 expired 已过期 used_up 已用完 deleted 已删除
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// VIP兑换记录表
export const vipRedeemHistory = pgTable('vip_redeem_history', {
  id: serial('id').primaryKey(),
  codeId: integer('code_id').notNull().references(() => vipRedeemCodes.id, { onDelete: 'restrict' }), // 兑换码ID
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }), // 用户ID
  status: varchar('status', { length: 20 }).notNull(), // success, failed, expired
  message: text('message'), // 失败原因或备注
  redeemedAt: timestamp('redeemed_at').defaultNow().notNull(),
  // 快照字段（可选，便于追溯当时的兑换内容）
  snapshot: jsonb('snapshot'), // 记录兑换时的套餐/时长/等级等信息快照
})

// 用户VIP状态表
export const userVipStatus = pgTable('user_vip_status', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }), // 用户ID 用户删除时删除VIP状态
  isVip: boolean('is_vip').default(false), // 是否为VIP
  vipExpireDate: timestamp('vip_expire_date'), // VIP到期时间
  autoRenew: boolean('auto_renew').default(false), // 是否自动续费
  lastRenewalDate: timestamp('last_renewal_date'), // 上次续费时间
  createdAt: timestamp('created_at').defaultNow().notNull(), // 创建时间
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // 更新时间
})

export const vipOrdersRelations = relations(vipOrders, ({ one }) => ({
	plan: one(vipPlans, {
		fields: [vipOrders.planId],
		references: [vipPlans.id],
	}),
  user: one(users, {
    fields: [vipOrders.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [vipOrders.reviewedBy],
    references: [users.id],
  }),
}))

export const vipRedeemCodesRelations = relations(vipRedeemCodes, ({ one, many }) => ({
  plan: one(vipPlans, {
    fields: [vipRedeemCodes.planId],
    references: [vipPlans.id],
  }),
  history: many(vipRedeemHistory),
}))

export const vipRedeemHistoryRelations = relations(vipRedeemHistory, ({ one }) => ({
  redeemCode: one(vipRedeemCodes, {
    fields: [vipRedeemHistory.codeId],
    references: [vipRedeemCodes.id],
  }),
  user: one(users, {
    fields: [vipRedeemHistory.userId],
    references: [users.id],
  }),
}))
