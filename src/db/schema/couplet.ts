import { sql } from 'drizzle-orm'
import {
  serial,
  timestamp,
  varchar,
  integer,
  boolean,
  pgTable,
  text,
} from 'drizzle-orm/pg-core'

import { users } from './users'

// 对联分类表
export const coupletCategories = pgTable('couplet_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 20 }),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 对联表
export const couplets = pgTable('couplets', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  categoryId: integer('category_id').references(() => coupletCategories.id, { onDelete: 'set null' }),
  authorId: text('author_id').references(() => users.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 20 }).notNull().default('published'),
  isPublic: boolean('is_public').notNull().default(true),
  viewCount: integer('view_count').notNull().default(0),
  likeCount: integer('like_count').notNull().default(0),
  hot: integer('hot').notNull().default(0),
  model: varchar('model', { length: 100 }),
  prompt: text('prompt'),
  isFeatured: boolean('is_featured').notNull().default(false),
  language: varchar('language', { length: 10 }).notNull().default('en'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 对联版本管理表
export const coupletVersions = pgTable('couplet_versions', {
  id: serial('id').primaryKey(),
  coupletId: integer('couplet_id')
    .references(() => couplets.id, { onDelete: 'cascade' })
    .notNull(),
  version: integer('version').notNull(),
  parentVersionId: integer('parent_version_id'),
  versionDescription: text('version_description'),
  isLatestVersion: boolean('is_latest_version').notNull().default(true),
  originalCoupletId: integer('original_couplet_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 对联内容表（上联、下联、横批等）
export const coupletContents = pgTable('couplet_contents', {
  id: serial('id').primaryKey(),
  coupletId: integer('couplet_id').references(() => couplets.id, { onDelete: 'cascade' }).notNull(),
  versionId: integer('version_id').references(() => coupletVersions.id, { onDelete: 'cascade' }).notNull(),
  upperLine: varchar('upper_line', { length: 255 }), // 上联
  lowerLine: varchar('lower_line', { length: 255 }), // 下联
  horizontalScroll: varchar('horizontal_scroll', { length: 255 }), // 横批
  appreciation: text('appreciation'), // 赏析内容
  orderIndex: integer('order_index').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 对联标签表
export const coupletTags = pgTable('couplet_tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  color: varchar('color', { length: 20 }),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 对联标签关联表
export const coupletTagRelations = pgTable('couplet_tag_relations', {
  id: serial('id').primaryKey(),
  coupletId: integer('couplet_id').references(() => couplets.id, { onDelete: 'cascade' }).notNull(),
  tagId: integer('tag_id').references(() => coupletTags.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 用户收藏表
export const coupletFavorites = pgTable('couplet_favorites', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  coupletId: integer('couplet_id').references(() => couplets.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 用户点赞表
export const coupletLikes = pgTable('couplet_likes', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  coupletId: integer('couplet_id').references(() => couplets.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 用户评论表
export const coupletComments = pgTable('couplet_comments', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  coupletId: integer('couplet_id').references(() => couplets.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  parentId: integer('parent_id'), // 回复功能，暂时不设置外键引用
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 对联浏览明细表
export const coupletViews = pgTable('couplet_views', {
  id: serial('id').primaryKey(),
  coupletId: integer('couplet_id').references(() => couplets.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  ip: varchar('ip', { length: 64 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

