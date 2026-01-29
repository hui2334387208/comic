import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined')
}

// 创建 postgres 客户端
const client = postgres(process.env.DATABASE_URL, {
  max: 10, // 最大连接数
  idle_timeout: 20, // 空闲连接超时时间（秒）
  connect_timeout: 10, // 连接超时时间（秒）
})

// 创建 drizzle 实例
export const db = drizzle(client, { schema })

// 测试数据库连接
client`SELECT 1`
  .then(() => {
    console.log('Database connected successfully')
  })
  .catch((error) => {
    console.error('Database connection error:', error)
  })
