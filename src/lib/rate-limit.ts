import { NextRequest } from 'next/server'

// 简单的内存存储，生产环境建议使用 Redis
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export interface RateLimitOptions {
  windowMs: number // 时间窗口（毫秒）
  maxAttempts: number // 最大尝试次数
  keyGenerator?: (req: NextRequest) => string // 自定义键生成器
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

export function createRateLimit(options: RateLimitOptions) {
  const { windowMs, maxAttempts, keyGenerator } = options

  return (req: NextRequest): RateLimitResult => {
    const key = keyGenerator ? keyGenerator(req) : getDefaultKey(req)
    const now = Date.now()
    const windowStart = now - windowMs

    // 清理过期的记录
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k)
      }
    }

    const current = rateLimitStore.get(key)
    
    if (!current || current.resetTime < now) {
      // 创建新记录
      const newRecord = {
        count: 1,
        resetTime: now + windowMs
      }
      rateLimitStore.set(key, newRecord)
      
      return {
        allowed: true,
        remaining: maxAttempts - 1,
        resetTime: newRecord.resetTime
      }
    }

    if (current.count >= maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime,
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      }
    }

    // 增加计数
    current.count++
    rateLimitStore.set(key, current)

    return {
      allowed: true,
      remaining: maxAttempts - current.count,
      resetTime: current.resetTime
    }
  }
}

function getDefaultKey(req: NextRequest): string {
  // 使用 IP 地址作为默认键
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return `rate_limit:${ip}`
}

// 预定义的频率限制器
export const signupRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  maxAttempts: 3, // 最多3次注册尝试
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `signup:${ip}`
  }
})

export const emailVerificationRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  maxAttempts: 5, // 最多5次验证尝试
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `email_verify:${ip}`
  }
})

// 登录频率限制
export const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  maxAttempts: 10, // 最多10次登录尝试
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `login:${ip}`
  }
})

// 验证邮箱频率限制
export const verifyEmailRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1分钟
  maxAttempts: 5, // 最多5次验证尝试
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `verify_email:${ip}`
  }
})

// 重新发送验证邮件频率限制
export const resendVerificationRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  maxAttempts: 3, // 最多3次重发尝试
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `resend_verification:${ip}`
  }
})

// 修改密码频率限制
export const changePasswordRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000, // 10分钟
  maxAttempts: 3, // 最多3次修改尝试
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `change_password:${ip}`
  }
})

// 公开API速率限制 - 防止恶意攻击
// 每分钟最多20次请求，防止恶意刷取和攻击
export const publicApiRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1分钟
  maxAttempts: 20, // 最多20次请求
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    // 包含路径，以便对不同API端点分别限制
    const path = new URL(req.url).pathname
    return `public_api:${ip}:${path}`
  }
})