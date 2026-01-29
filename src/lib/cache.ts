import { Redis } from '@upstash/redis'

// 使用 Upstash 官方 SDK，通过环境变量自动读取连接信息
// 需要配置：UPSTASH_REDIS_REST_URL、UPSTASH_REDIS_REST_TOKEN
const redis = Redis.fromEnv()

type CacheValue = any

export function buildCacheKey(prefix: string, parts: Record<string, unknown>) {
  const sorted = Object.keys(parts)
    .sort()
    .map((k) => `${k}:${String((parts as any)[k])}`)
    .join('|')
  return `${prefix}:${sorted}`
}

/**
 * 带缓存的异步函数执行
 * @param key 缓存键
 * @param ttlSeconds 缓存过期时间（秒）
 * @param fn 需要执行的函数
 * @returns 缓存结果或函数执行结果
 */
export async function withCache<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  try {
    // 尝试从缓存获取
    const hit = (await redis.get(key)) as T | null
    if (hit !== null && hit !== undefined) {
      return hit
    }

    // 缓存未命中，执行函数
    const result = await fn()
    
    // 将结果存入缓存
    await redis.set(key, result as CacheValue, { ex: ttlSeconds })
    return result
  } catch (error) {
    // 如果 Redis 操作失败，直接执行函数（降级处理）
    console.error('Redis cache error:', error)
    return await fn()
  }
}

/**
 * 生成 HTTP 缓存头
 * @param ttlSeconds 缓存时间（秒）
 * @param swrSeconds stale-while-revalidate 时间（秒）
 * @returns 缓存头对象
 */
export function cacheHeaders(ttlSeconds: number, swrSeconds = 60) {
  return {
    'Cache-Control': `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${swrSeconds}`,
  }
}

/**
 * 生成强制重新验证的 HTTP 缓存头（用于清除 HTTP 缓存）
 * 注意：Vercel CDN 缓存无法直接清除，但可以通过这个头强制重新验证
 * @returns 缓存头对象
 */
export function noCacheHeaders() {
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  }
}

/**
 * 删除缓存
 * @param key 缓存键
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error('Redis cache invalidation error:', error)
  }
}

/**
 * 批量删除匹配模式的缓存键
 * @param pattern 匹配模式（如 'timeline:*'）
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    // Upstash Redis 使用 keys 命令查找匹配的键
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Redis cache pattern invalidation error:', error)
  }
}

