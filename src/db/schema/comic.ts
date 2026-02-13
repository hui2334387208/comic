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

// 漫画分类表
export const comicCategories = pgTable('comic_categories', {
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

// 漫画表（基本信息）
export const comics = pgTable('comics', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(), // 名称
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'), // 描述
  categoryId: integer('category_id').references(() => comicCategories.id, { onDelete: 'set null' }), // 分类
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
  coverImage: varchar('cover_image', { length: 500 }),
  volumeCount: integer('volume_count').default(0), // 总卷数
  episodeCount: integer('episode_count').default(0), // 总话数
  style: varchar('style', { length: 100 }), // 风格
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 漫画版本管理表
export const comicVersions = pgTable('comic_versions', {
  id: serial('id').primaryKey(),
  comicId: integer('comic_id').references(() => comics.id, { onDelete: 'cascade' }).notNull(),
  version: integer('version').notNull(),
  parentVersionId: integer('parent_version_id'),
  versionDescription: text('version_description'),
  isLatestVersion: boolean('is_latest_version').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 漫画卷表
export const comicVolumes = pgTable('comic_volumes', {
  id: serial('id').primaryKey(),
  comicId: integer('comic_id').references(() => comics.id, { onDelete: 'cascade' }).notNull(),
  versionId: integer('version_id').references(() => comicVersions.id, { onDelete: 'cascade' }).notNull(),
  volumeNumber: integer('volume_number').notNull(), // 第几卷
  title: varchar('title', { length: 255 }).notNull(), // 卷标题
  description: text('description'), // 卷描述
  coverImage: varchar('cover_image', { length: 500 }), // 卷封面
  episodeCount: integer('episode_count').default(0), // 这卷有多少话
  startEpisode: integer('start_episode'), // 起始话数
  endEpisode: integer('end_episode'), // 结束话数
  status: varchar('status', { length: 20 }).notNull().default('published'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 漫画章节/话表
export const comicEpisodes = pgTable('comic_episodes', {
  id: serial('id').primaryKey(),
  comicId: integer('comic_id').references(() => comics.id, { onDelete: 'cascade' }).notNull(),
  versionId: integer('version_id').references(() => comicVersions.id, { onDelete: 'cascade' }).notNull(),
  volumeId: integer('volume_id').references(() => comicVolumes.id, { onDelete: 'cascade' }), // 所属卷
  episodeNumber: integer('episode_number').notNull(), // 第几话
  title: varchar('title', { length: 255 }).notNull(), // 话标题
  description: text('description'), // 话描述
  pageCount: integer('page_count').default(0), // 这话有多少页
  status: varchar('status', { length: 20 }).notNull().default('published'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 漫画页表（每话的具体页面）
export const comicPages = pgTable('comic_pages', {
  id: serial('id').primaryKey(),
  episodeId: integer('episode_id').references(() => comicEpisodes.id, { onDelete: 'cascade' }).notNull(),
  pageNumber: integer('page_number').notNull(), // 第几页
  pageLayout: varchar('page_layout', { length: 50 }), // 页面布局类型（单格、双格、多格等）
  panelCount: integer('panel_count').default(0), // 这页有多少格
  imageUrl: varchar('image_url', { length: 500 }), // 页面合成图片URL
  status: varchar('status', { length: 20 }).notNull().default('published'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 漫画分镜/格表（每页的具体分镜格子）
// 注意：每一格不需要单独的图片，而是组合成页面图片
export const comicPanels = pgTable('comic_panels', {
  id: serial('id').primaryKey(),
  pageId: integer('page_id').references(() => comicPages.id, { onDelete: 'cascade' }).notNull(),
  panelNumber: integer('panel_number').notNull(), // 第几格
  // 分镜信息
  sceneDescription: text('scene_description'), // 画面描述
  dialogue: text('dialogue'), // 对话
  narration: text('narration'), // 旁白
  emotion: varchar('emotion', { length: 50 }), // 情感氛围
  cameraAngle: varchar('camera_angle', { length: 50 }), // 镜头角度
  characters: text('characters'), // 角色信息（JSON格式）
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 漫画标签表
export const comicTags = pgTable('comic_tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  color: varchar('color', { length: 20 }),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 漫画标签关联表
export const comicTagRelations = pgTable('comic_tag_relations', {
  id: serial('id').primaryKey(),
  comicId: integer('comic_id').references(() => comics.id, { onDelete: 'cascade' }).notNull(),
  tagId: integer('tag_id').references(() => comicTags.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 用户收藏表
export const comicFavorites = pgTable('comic_favorites', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  comicId: integer('comic_id').references(() => comics.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 用户点赞表
export const comicLikes = pgTable('comic_likes', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  comicId: integer('comic_id').references(() => comics.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 用户评论表
export const comicComments = pgTable('comic_comments', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  comicId: integer('comic_id').references(() => comics.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  parentId: integer('parent_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 漫画浏览明细表
export const comicViews = pgTable('comic_views', {
  id: serial('id').primaryKey(),
  comicId: integer('comic_id').references(() => comics.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  ip: varchar('ip', { length: 64 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
