import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { creditRedeemHistory, creditRedeemCodes } from '@/db/schema/credits'
import { eq, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      )
    }

    // 查询用户的兑换记录，关联兑换码信息
    const records = await db
      .select({
        id: creditRedeemHistory.id,
        code: creditRedeemCodes.code,
        credits: creditRedeemHistory.credits,
        redeemedAt: creditRedeemHistory.redeemedAt,
      })
      .from(creditRedeemHistory)
      .innerJoin(creditRedeemCodes, eq(creditRedeemHistory.codeId, creditRedeemCodes.id))
      .where(eq(creditRedeemHistory.userId, session.user.id))
      .orderBy(desc(creditRedeemHistory.redeemedAt))
      .limit(50)

    return NextResponse.json({
      success: true,
      data: records,
    })
  } catch (error) {
    console.error('获取兑换记录失败:', error)
    return NextResponse.json(
      { success: false, error: '获取兑换记录失败' },
      { status: 500 }
    )
  }
}
