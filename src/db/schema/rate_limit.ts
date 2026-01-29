import { pgTable, serial, varchar, integer, date, uniqueIndex } from 'drizzle-orm/pg-core'

export const generationRateLimits = pgTable('generation_rate_limits', {
  id: serial('id').primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(), // userId or IP address
  count: integer('count').notNull().default(0),
  day: date('day').notNull(),
}, (table) => [
  uniqueIndex('generation_rate_limits_identifier_day_unique').on(table.identifier, table.day),
])
