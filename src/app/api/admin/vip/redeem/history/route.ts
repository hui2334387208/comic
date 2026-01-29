import { eq, desc, count } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { vipRedeemHistory, vipRedeemCodes, users } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  // 权限检查
  const permissionCheck = await requirePermission('redeem-history.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  // 联表查用户和兑换码
  const [totalResult, rows] = await Promise.all([
    db.select({ total: count() }).from(vipRedeemHistory),
    db
      .select({
        id: vipRedeemHistory.id,
        userId: vipRedeemHistory.userId,
        userName: users.name,
        code: vipRedeemCodes.code,
        status: vipRedeemHistory.status,
        message: vipRedeemHistory.message,
        redeemedAt: vipRedeemHistory.redeemedAt,
        snapshot: vipRedeemHistory.snapshot,
      })
      .from(vipRedeemHistory)
      .leftJoin(users, eq(vipRedeemHistory.userId, users.id))
      .leftJoin(vipRedeemCodes, eq(vipRedeemHistory.codeId, vipRedeemCodes.id))
      .orderBy(desc(vipRedeemHistory.redeemedAt))
      .limit(limit)
      .offset(offset),
  ])

  const total = totalResult[0]?.total || 0

  return NextResponse.json({
    data: rows,
    total,
    page,
    limit,
  })
}
