import { randomUUID } from 'crypto'

import { hash } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { users, verificationTokens } from '@/db/schema'
import { sendVerificationEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { signupRateLimit } from '@/lib/rate-limit'

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'steamer-admin-2024'

export async function POST(req: Request) {
  try {

    // 频率限制检查
    const rateLimitResult = signupRateLimit(req as any)
    if (!rateLimitResult.allowed) {
      await logger.warning({
        module: 'auth',
        action: 'sign-up',
        description: `注册被限制：频率过高 (IP: ${req.headers.get('x-forwarded-for') || 'unknown'})`,
      })
      return NextResponse.json(
        { 
          error: `注册过于频繁，请稍后再试`,
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '900'
          }
        },
      )
    }

    const { email, password, username, role, secretKey } = await req.json()

    // 输入验证和清理
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: '邮箱、密码和用户名都是必填项' },
        { status: 400 },
      )
    }

    // 清理和验证输入
    const cleanEmail = email.trim().toLowerCase()
    const cleanUsername = username.trim()
    const cleanRole = role?.trim() || 'user'

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 },
      )
    }

    // 用户名验证
    if (cleanUsername.length < 2 || cleanUsername.length > 20) {
      return NextResponse.json(
        { error: '用户名长度必须在2-20个字符之间' },
        { status: 400 },
      )
    }

    // 用户名格式验证（只允许字母、数字、下划线）
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(cleanUsername)) {
      return NextResponse.json(
        { error: '用户名只能包含字母、数字和下划线' },
        { status: 400 },
      )
    }

    // 密码强度验证
    if (password.length < 8) {
      return NextResponse.json(
        { error: '密码长度至少8位' },
        { status: 400 },
      )
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: '密码长度不能超过128位' },
        { status: 400 },
      )
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: '密码必须包含大小写字母和数字' },
        { status: 400 },
      )
    }

    // 检查常见弱密码
    const commonPasswords = ['password', '123456', '123456789', 'qwerty', 'abc123', 'password123', 'admin', 'letmein']
    if (commonPasswords.includes(password.toLowerCase())) {
      return NextResponse.json(
        { error: '密码过于简单，请选择更安全的密码' },
        { status: 400 },
      )
    }

    // 检查密码是否包含用户名
    if (password.toLowerCase().includes(cleanUsername.toLowerCase())) {
      return NextResponse.json(
        { error: '密码不能包含用户名' },
        { status: 400 },
      )
    }

    // 检查邮箱是否已存在
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, cleanEmail),
    })

    if (existingUser) {
      await logger.error({
        module: 'auth',
        action: 'sign-up',
        description: `注册失败：邮箱已被注册 (${cleanEmail})`,
      })
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 },
      )
    }

    // 检查用户名是否已存在
    const existingUsername = await db.query.users.findFirst({
      where: eq(users.username, cleanUsername),
    })

    if (existingUsername) {
      await logger.error({
        module: 'auth',
        action: 'sign-up',
        description: `注册失败：用户名已被使用 (${cleanUsername})`,
      })
      return NextResponse.json(
        { error: '该用户名已被使用' },
        { status: 400 },
      )
    }

    // 如果要注册管理员账号，验证密钥
    if (cleanRole === 'admin') {
      if (secretKey !== ADMIN_SECRET_KEY) {
        await logger.error({
          module: 'auth',
          action: 'sign-up',
          description: `注册失败：管理员密钥无效 (${email})`,
        })
        return NextResponse.json(
          { error: '管理员密钥无效' },
          { status: 403 },
        )
      }
    }

    // 加密密码
    const hashedPassword = await hash(password, 12)

    // 创建用户（未验证状态）
    try {
      const userId = randomUUID()
      const insertData = {
        id: userId,
        name: cleanUsername, // NextAuth 需要的 name 字段
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
        role: cleanRole,
        emailVerified: null, // 初始状态为未验证
        created_at: new Date(),
        updated_at: new Date(),
      }

      const [user] = await db.insert(users).values(insertData).returning()

      // 创建验证令牌
      const verificationToken = randomUUID()
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期

      await db.insert(verificationTokens).values({
        identifier: cleanEmail,
        token: verificationToken,
        expires,
      })

      // 发送验证邮件
      const emailResult = await sendVerificationEmail({
        email: cleanEmail,
        token: verificationToken,
        username: cleanUsername,
      })

      if (!emailResult.success) {
        // 如果邮件发送失败，删除用户和令牌
        await db.delete(users).where(eq(users.id, userId))
        await db.delete(verificationTokens).where(eq(verificationTokens.token, verificationToken))

        await logger.error({
          module: 'auth',
          action: 'sign-up',
          description: `注册失败：邮件发送失败 (${email})`,
        })

        return NextResponse.json(
          { error: '邮件发送失败，请检查邮箱地址是否正确' },
          { status: 500 },
        )
      }

      await logger.info({
        module: 'auth',
        action: 'sign-up',
        description: `用户注册成功，验证邮件已发送 (${user.email})`,
        userId: user.id,
      })

      return NextResponse.json({
        message: '注册成功！请检查您的邮箱并点击验证链接完成注册。',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      })
    } catch (dbError: any) {
      console.error('数据库错误详情:', {
        message: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
        hint: dbError.hint,
        stack: dbError.stack,
      })

      await logger.error({
        module: 'auth',
        action: 'sign-up',
        description: `注册失败：数据库错误 (${dbError.message})`,
      })

      if (dbError.code === '23505') { // 唯一约束违反
        return NextResponse.json(
          { error: '用户名或邮箱已被使用' },
          { status: 400 },
        )
      }

      return NextResponse.json(
        { error: `数据库操作失败: ${dbError.message}` },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error('注册错误:', error)
    await logger.error({
      module: 'auth',
      action: 'sign-up',
      description: `注册失败：系统错误 (${error instanceof Error ? error.message : '未知错误'})`,
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '注册失败，请重试' },
      { status: 500 },
    )
  }
}
