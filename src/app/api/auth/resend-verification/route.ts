import { randomUUID } from 'crypto'

import { eq, and, gt } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { users, verificationTokens } from '@/db/schema'
import { sendVerificationEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { resendVerificationRateLimit } from '@/lib/rate-limit'


export async function POST(req: Request) {
  try {
    // 频率限制检查
    const rateLimitResult = resendVerificationRateLimit(req as any)
    if (!rateLimitResult.allowed) {
      await logger.warning({
        module: 'auth',
        action: 'resend-verification',
        description: `重新发送验证邮件被限制：频率过高 (IP: ${req.headers.get('x-forwarded-for') || 'unknown'})`,
      })
      return NextResponse.json(
        { 
          error: `重新发送过于频繁，请稍后再试`,
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '300'
          }
        },
      )
    }

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: '邮箱地址不能为空' },
        { status: 400 },
      )
    }

    // 查找用户
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      await logger.error({
        module: 'auth',
        action: 'resend-verification',
        description: `重新发送验证邮件失败：用户不存在 (${email})`,
      })
      return NextResponse.json(
        { error: '该邮箱地址未注册' },
        { status: 404 },
      )
    }

    // 检查邮箱是否已经验证
    if (user.emailVerified) {
      await logger.info({
        module: 'auth',
        action: 'resend-verification',
        description: `重新发送验证邮件失败：邮箱已验证 (${email})`,
        userId: user.id,
      })
      return NextResponse.json(
        { error: '该邮箱已经验证过了' },
        { status: 400 },
      )
    }

    // 删除旧的验证令牌
    await db.delete(verificationTokens)
      .where(eq(verificationTokens.identifier, email))

    // 创建新的验证令牌
    const verificationToken = randomUUID()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期

    await db.insert(verificationTokens).values({
      identifier: email,
      token: verificationToken,
      expires,
    })

    // 发送验证邮件
    const emailResult = await sendVerificationEmail({
      email,
      token: verificationToken,
      username: user.username,
    })

    if (!emailResult.success) {
      // 如果邮件发送失败，删除令牌
      await db.delete(verificationTokens)
        .where(eq(verificationTokens.token, verificationToken))

      await logger.error({
        module: 'auth',
        action: 'resend-verification',
        description: `重新发送验证邮件失败：邮件发送失败 (${email})`,
        userId: user.id,
      })

      return NextResponse.json(
        { error: '邮件发送失败，请检查邮箱地址是否正确' },
        { status: 500 },
      )
    }

    await logger.info({
      module: 'auth',
      action: 'resend-verification',
      description: `重新发送验证邮件成功 (${email})`,
      userId: user.id,
    })

    return NextResponse.json({
      message: '验证邮件已重新发送，请检查您的邮箱',
    })
  } catch (error) {
    console.error('重新发送验证邮件错误:', error)
    await logger.error({
      module: 'auth',
      action: 'resend-verification',
      description: `重新发送验证邮件失败：系统错误 (${error instanceof Error ? error.message : '未知错误'})`,
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '重新发送验证邮件失败，请重试' },
      { status: 500 },
    )
  }
}
