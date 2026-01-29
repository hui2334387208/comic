import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { users } from '@/db/schema'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    const { username } = await req.json()

    if (!username) {
      return NextResponse.json(
        { error: '用户名不能为空' },
        { status: 400 },
      )
    }

    const cleanUsername = username.trim()

    // 用户名格式验证
    if (cleanUsername.length < 2 || cleanUsername.length > 20) {
      return NextResponse.json(
        { error: '用户名长度必须在2-20个字符之间' },
        { status: 400 },
      )
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(cleanUsername)) {
      return NextResponse.json(
        { error: '用户名只能包含字母、数字和下划线' },
        { status: 400 },
      )
    }

    // 检查用户名是否已存在
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, cleanUsername),
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '该用户名已被使用' },
        { status: 400 },
      )
    }

    return NextResponse.json({ available: true })
  } catch (error) {
    console.error('检查用户名失败:', error)
    await logger.error({
      module: 'auth',
      action: 'check-username',
      description: `检查用户名失败：${error instanceof Error ? error.message : '未知错误'}`,
    })
    return NextResponse.json(
      { error: '检查用户名失败，请重试' },
      { status: 500 },
    )
  }
}
