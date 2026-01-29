import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/db'
import { coupletTags } from '@/db/schema'
import { publicApiRateLimit } from '@/lib/rate-limit'

// GET /api/couplet/tags - 获取对联标签列表
export async function GET(request: NextRequest) {
  try {
    const rateLimit = publicApiRateLimit(request)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: '请求过于频繁，请稍后再试' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter ?? Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
          },
        },
      )
    }

    const tags = await db
      .select()
      .from(coupletTags)
      .where(eq(coupletTags.status, 'active'))
      .orderBy(coupletTags.createdAt)

    return NextResponse.json(tags)
  } catch (error) {
    console.error('获取对联标签失败:', error)
    return NextResponse.json(
      { success: false, message: '获取对联标签失败' },
      { status: 500 },
    )
  }
}