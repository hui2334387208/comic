import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

import { users } from './users'

export const systemLogs = pgTable('system_logs', {
  id: serial('id').primaryKey(),
  level: text('level').notNull(), // info, warning, error
  module: text('module').notNull(), // 模块名称
  action: text('action').notNull(), // 操作类型
  description: text('description').notNull(), // 详细描述
  ip: text('ip'), // IP地址
  userAgent: text('user_agent'), // 用户代理
  userId: text('user_id').references(() => users.id), // 关联用户ID
  language: varchar('language', { length: 100 }).notNull().default('en'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
