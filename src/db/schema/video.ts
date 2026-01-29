import { sql } from 'drizzle-orm'
import {
  serial,
  timestamp,
  varchar,
  integer,
  jsonb,
 pgTable } from 'drizzle-orm/pg-core'


export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  title: jsonb('title').notNull(), // 多语言标题
  description: jsonb('description'), // 多语言描述
  url: varchar('url', { length: 1024 }).notNull(),
  filename: varchar('filename', { length: 255 }), // 文件名
  filesize: varchar('filesize', { length: 50 }), // 文件大小
  filetype: varchar('filetype', { length: 100 }), // 文件类型
  duration: integer('duration'), // 视频时长（秒）
  views: integer('views').default(0),
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft, published, archived
  sort: integer('sort').default(0), // 排序权重
  createdAt: timestamp('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
