import { pgTable, text, timestamp, varchar, boolean, integer, json } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// 后台菜单表
export const adminMenus = pgTable('admin_menus', {
  id: text('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  label: varchar('label', { length: 200 }).notNull(),
  path: varchar('path', { length: 200 }).notNull(),
  icon: varchar('icon', { length: 100 }),
  parentId: text('parent_id'), // 父菜单ID
  permission: varchar('permission', { length: 200 }), // 权限标识
  order: integer('order').notNull().default(0), // 排序
  isVisible: boolean('is_visible').notNull().default(true), // 是否可见
  isSystem: boolean('is_system').notNull().default(false), // 是否系统菜单
  meta: json('meta').$type<{
    description?: string
    external?: boolean
    target?: string
    badge?: string
    badgeColor?: string
  }>(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
})

// 定义关系
export const adminMenusRelations = relations(adminMenus, ({ many, one }) => ({
  children: many(adminMenus, {
    relationName: 'parentChildren'
  }),
  parent: one(adminMenus, {
    fields: [adminMenus.parentId],
    references: [adminMenus.id],
    relationName: 'parentChildren'
  }),
}))
