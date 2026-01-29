import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/db'
import { contacts } from '@/db/schema/contact'

// 简化的速率限制 - 在生产环境中应使用更强大的库，如 Upstash Ratelimit
const ratelimit = {
  limit: async (ip: string) => {
    // 示例：这里可以实现基于内存、Redis等的速率限制逻辑
    return { success: true, limit: 10, remaining: 9, reset: new Date(Date.now() + 60000) }
  },
}

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = (await headers()).get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1'
    const { success, limit, remaining, reset } = await ratelimit.limit(ip)

    if (!success) {
      return NextResponse.json(
        { success: false, message: '请求过于频繁，请稍后再试。' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        },
      )
    }

    const body = await request.json()
    const { name, email, subject, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 },
      )
    }

    const newContact = await db
      .insert(contacts)
      .values({
        name,
        email,
        subject,
        message,
        ipAddress: ip,
      })
      .returning()

    return NextResponse.json({
      success: true,
      data: newContact[0],
      message: '您的消息已成功发送，感谢您的联系！',
    })
  } catch (error) {
    console.error('联系表单提交失败:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后再试。' },
      { status: 500 },
    )
  }
}
