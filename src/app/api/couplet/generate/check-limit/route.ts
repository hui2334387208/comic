import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { and, eq } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { userVipStatus } from '@/db/schema'
import { generationRateLimits } from '@/db/schema/rate_limit'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null
    const userRole = session?.user?.role

    let dailyLimit = 5
    let isVipActive = false

    if (userId) {
      const vipStatus = await db
        .select({
          isVip: userVipStatus.isVip,
          vipExpireDate: userVipStatus.vipExpireDate,
        })
        .from(userVipStatus)
        .where(eq(userVipStatus.userId, userId))
        .limit(1)

      const now = new Date()
      const vipExpireDate = vipStatus[0]?.vipExpireDate
      isVipActive = Boolean(vipStatus[0]?.isVip && vipExpireDate && vipExpireDate > now)
    }

    if (isVipActive || userRole === 'admin') {
      dailyLimit = 100
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    const identifier = userId || ip
    if (!identifier) {
      return new Response(JSON.stringify({ error: '无法验证您的请求身份，请稍后再试。' }), { status: 400 })
    }

    const today = new Date().toISOString().slice(0, 10)
    const limits = await db
      .select({ count: generationRateLimits.count })
      .from(generationRateLimits)
      .where(
        and(
          eq(generationRateLimits.identifier, identifier),
          eq(generationRateLimits.day, today as unknown as any),
        ),
      )
    const currentCount = limits[0]?.count ?? 0

    const allowed = currentCount < dailyLimit
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          allowed,
          limit: dailyLimit,
          used: currentCount,
          remaining: Math.max(0, dailyLimit - currentCount),
          isVipActive,
          userRole: userRole || null,
        },
      }),
      { headers: { 'Content-Type': 'application/json' }, status: allowed ? 200 : 429 },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: '限额检查失败', detail: error?.message }), { status: 500 })
  }
}
