import { headers } from 'next/headers'
import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { feedback } from '@/db/schema'
import { logger } from '@/lib/logger'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'

// 简化的速率限制 - 在生产环境中应使用更强大的库，如 Upstash Ratelimit
const ratelimit = {
  limit: async (ip: string) => {
    // 示例：这里可以实现基于内存、Redis等的速率限制逻辑
    return { success: true, limit: 10, remaining: 9, reset: new Date(Date.now() + 60000) }
  },
}

export async function POST(request: NextRequest) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('feedback.create')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

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
    const { name, email, type, title, description, priority } = body

    // 验证必填字段
    if (!name || !type || !title || !description) {
      await logger.warning({
        module: 'feedback',
        action: 'create',
        description: '创建反馈失败：缺少必填字段',
      })
      return NextResponse.json(
        { success: false, message: '请填写所有必填项。' },
        { status: 400 },
      )
    }

    const newFeedback = await db
      .insert(feedback)
      .values({
        name,
        email,
        type,
        title,
        description,
        priority: priority || 'medium',
        ipAddress: ip,
      })
      .returning()

    await logger.info({
      module: 'feedback',
      action: 'create',
      description: `创建反馈成功: ${title}`,
    })

    return NextResponse.json({
      success: true,
      data: newFeedback[0],
      message: '感谢您的反馈，我们会尽快处理！',
    })

  } catch (error) {
    console.error('创建反馈失败:', error)
    await logger.error({
      module: 'feedback',
      action: 'create',
      description: `创建反馈失败: ${error instanceof Error ? error.message : '未知错误'}`,
    })
    return NextResponse.json(
      { success: false, message: '服务器错误，创建反馈失败。' },
      { status: 500 },
    )
  }
}

// 注意: GET方法暂时保留，但字段可能需要根据新的schema调整
export async function GET(request: NextRequest) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('feedback.read')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const list = await db.select().from(feedback).orderBy(feedback.createdAt)
    return NextResponse.json(list)
  } catch (error) {
    await logger.error({
      module: 'feedback',
      action: 'list',
      description: `获取反馈列表失败: ${error instanceof Error ? error.message : '未知错误'}`,
    })
    return NextResponse.json({ error: '获取反馈列表失败' }, { status: 500 })
  }
}
