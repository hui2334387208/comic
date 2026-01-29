import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/db'
import { coupletCategories } from '@/db/schema'
import { publicApiRateLimit } from '@/lib/rate-limit'

// GET /api/couplet/categories - 获取对联分类列表
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

    const categories = await db
      .select()
      .from(coupletCategories)
      .where(eq(coupletCategories.status, 'active'))
      .orderBy(coupletCategories.sortOrder)

    return NextResponse.json(categories)
  } catch (error) {
    console.error('获取对联分类失败:', error)
    return NextResponse.json(
      { success: false, message: '获取对联分类失败' },
      { status: 500 },
    )
  }
}
