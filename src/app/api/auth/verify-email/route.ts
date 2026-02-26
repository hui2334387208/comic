import { eq, and, gt } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { users, verificationTokens } from '@/db/schema'
import { logger } from '@/lib/logger'
import { verifyEmailRateLimit } from '@/lib/rate-limit'
import { createReferralCode, completeReferralTask } from '@/lib/referral-utils'

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

    // 为新用户创建邀请码
    const referralCodeResult = await createReferralCode(user.id)
    if (!referralCodeResult.success) {
      console.warn('创建邀请码失败:', referralCodeResult.message)
    }

    // 完成邀请任务并发放奖励（如果用户使用了邀请码注册）
    const taskResult = await completeReferralTask(user.id, 'verified_email')
    if (taskResult.success) {
      await logger.info({
        module: 'auth',
        action: 'verify-email',
        description: `邀请任务完成，奖励已发放 (${user.email}) - 邀请人: ${taskResult.inviterReward}次, 被邀请人: ${taskResult.inviteeReward}次`,
        userId: user.id,
      })
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
