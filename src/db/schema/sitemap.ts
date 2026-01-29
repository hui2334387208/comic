import { sql } from 'drizzle-orm'
import { text, timestamp, pgTable, serial } from 'drizzle-orm/pg-core'

export const sitemap = pgTable('sitemap', {
  id: serial('id').primaryKey(),
  loc: text('loc').notNull(),
  lastmod: timestamp('lastmod').default(sql`CURRENT_TIMESTAMP`),
  changefreq: text('changefreq').default('daily'),
  priority: text('priority').default('0.5'),
  hreflang: text('hreflang'),
})
