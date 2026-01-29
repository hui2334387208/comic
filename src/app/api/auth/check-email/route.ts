import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { users } from '@/db/schema'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: '邮箱不能为空' },
        { status: 400 },
      )
    }

    const cleanEmail = email.trim().toLowerCase()

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 },
      )
    }

    // 检查邮箱是否已存在
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, cleanEmail),
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 },
      )
    }

    return NextResponse.json({ available: true })
  } catch (error) {
    console.error('检查邮箱失败:', error)
    await logger.error({
      module: 'auth',
      action: 'check-email',
      description: `检查邮箱失败：${error instanceof Error ? error.message : '未知错误'}`,
    })
    return NextResponse.json(
      { error: '检查邮箱失败，请重试' },
      { status: 500 },
    )
  }
}
