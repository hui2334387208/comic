import { eq, and, gt } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { users, verificationTokens } from '@/db/schema'
import { logger } from '@/lib/logger'
import { verifyEmailRateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  try {
    // 频率限制检查
    const rateLimitResult = verifyEmailRateLimit(req as any)
    if (!rateLimitResult.allowed) {
      await logger.warning({
        module: 'auth',
        action: 'verify-email',
        description: `邮箱验证被限制：频率过高 (IP: ${req.headers.get('x-forwarded-for') || 'unknown'})`,
      })
      return NextResponse.json(
        { 
          error: `验证过于频繁，请稍后再试`,
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
          }
        },
      )
    }

    const { token } = await req.json()

    if (!token) {
      return NextResponse.json(
        { error: '验证令牌不能为空' },
        { status: 400 },
      )
    }

    // 查找验证令牌
    const verificationToken = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.token, token),
        gt(verificationTokens.expires, new Date()),
      ),
    })

    if (!verificationToken) {
      await logger.error({
        module: 'auth',
        action: 'verify-email',
        description: '邮箱验证失败：无效或已过期的令牌',
      })
      return NextResponse.json(
        { error: '验证令牌无效或已过期' },
        { status: 400 },
      )
    }

    // 查找对应的用户
    const user = await db.query.users.findFirst({
      where: eq(users.email, verificationToken.identifier),
    })

    if (!user) {
      await logger.error({
        module: 'auth',
        action: 'verify-email',
        description: `邮箱验证失败：用户不存在 (${verificationToken.identifier})`,
      })
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 },
      )
    }

    // 更新用户邮箱验证状态
    await db.update(users)
      .set({
        emailVerified: new Date(),
        updated_at: new Date(),
      })
      .where(eq(users.id, user.id))

    // 删除验证令牌
    await db.delete(verificationTokens)
      .where(eq(verificationTokens.token, token))

    // 为用户创建Personal默认项目
    try {
      const defaultProjectResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/projects/create-default`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      if (!defaultProjectResponse.ok) {
        console.warn('创建默认项目失败，但不影响邮箱验证:', await defaultProjectResponse.text())
      } else {
        console.log('邮箱验证成功后自动创建默认项目成功')
      }
    } catch (projectError) {
      console.warn('创建默认项目时出错，但不影响邮箱验证:', projectError)
    }

    await logger.info({
      module: 'auth',
      action: 'verify-email',
      description: `邮箱验证成功 (${user.email})`,
      userId: user.id,
    })

    return NextResponse.json({
      message: '邮箱验证成功！您现在可以登录了。',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('邮箱验证错误:', error)
    await logger.error({
      module: 'auth',
      action: 'verify-email',
      description: `邮箱验证失败：系统错误 (${error instanceof Error ? error.message : '未知错误'})`,
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '邮箱验证失败，请重试' },
      { status: 500 },
    )
  }
}
