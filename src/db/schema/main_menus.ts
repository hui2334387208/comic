import { pgTable, serial, varchar, integer, boolean, timestamp, text } from 'drizzle-orm/pg-core'

export const mainMenus = pgTable('main_menus', {
  id: serial('id').primaryKey(),
  path: varchar('path', { length: 200 }).notNull(),
  icon: varchar('icon', { length: 50 }),
  parentId: integer('parent_id'),
  order: integer('order').notNull().default(0),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  isTop: boolean('is_top').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const mainMenuTranslations = pgTable('main_menu_translations', {
  id: serial('id').primaryKey(),
  menuId: integer('menu_id').notNull().references(() => mainMenus.id),
  lang: varchar('lang', { length: 10 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  metaKeywords: text('meta_keywords'),
})
