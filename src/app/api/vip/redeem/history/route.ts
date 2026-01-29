import { eq, desc, count } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { vipRedeemHistory, vipRedeemCodes, vipPlans } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }
  const userId = session.user.id
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  // 查询当前用户的兑换历史，联表查兑换码和套餐名
  const [totalResult, rows] = await Promise.all([
    db.select({ total: count() }).from(vipRedeemHistory).where(eq(vipRedeemHistory.userId, userId)),
    db
      .select({
        id: vipRedeemHistory.id,
        codeId: vipRedeemHistory.codeId,
        userId: vipRedeemHistory.userId,
        status: vipRedeemHistory.status,
        message: vipRedeemHistory.message,
        redeemedAt: vipRedeemHistory.redeemedAt,
        snapshot: vipRedeemHistory.snapshot,
        code: vipRedeemCodes.code,
        planName: vipPlans.name,
      })
      .from(vipRedeemHistory)
      .leftJoin(vipRedeemCodes, eq(vipRedeemHistory.codeId, vipRedeemCodes.id))
      .leftJoin(vipPlans, eq(vipRedeemCodes.planId, vipPlans.id))
      .where(eq(vipRedeemHistory.userId, userId))
      .orderBy(desc(vipRedeemHistory.redeemedAt))
      .limit(limit)
      .offset(offset),
  ])
  const total = totalResult[0]?.total || 0
  return NextResponse.json({ data: rows, total, page, limit })
}
