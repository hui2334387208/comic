import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { and, eq, sql } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { generationRateLimits } from '@/db/schema/rate_limit'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    const identifier = userId || ip

    if (!identifier) {
      return NextResponse.json({ error: '无法验证您的请求身份' }, { status: 400 })
    }

    const today = new Date().toISOString().slice(0, 10)

    // 使用 upsert 操作
    await db
      .insert(generationRateLimits)
      .values({
        identifier,
        day: today as unknown as any,
        count: 1,
      })
      .onConflictDoUpdate({
        target: [generationRateLimits.identifier, generationRateLimits.day],
        set: {
          count: sql`${generationRateLimits.count} + 1`,
        },
      })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: '计数更新失败', detail: error?.message }, { status: 500 })
  }
}