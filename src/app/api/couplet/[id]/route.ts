import { eq, and } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/db'
import { publicApiRateLimit } from '@/lib/rate-limit'
import { fetchCoupletDetail } from '@/lib/couplet-utils'

// GET /api/couplet/[id] - 获取对联详情
export async function GET(
  request: NextRequest,
  context: { params: Promise<any> },
) {
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

    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const versionId = searchParams.get('versionId')

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: '无效的对联ID' },
        { status: 400 },
      )
    }

    const result = await fetchCoupletDetail(id, versionId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('获取对联详情失败:', error)
    return NextResponse.json(
      { success: false, message: '获取对联详情失败' },
      { status: 500 },
    )
  }
}

