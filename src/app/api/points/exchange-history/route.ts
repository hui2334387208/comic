import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getExchangeHistory } from '@/lib/points-utils'

/**
 * GET /api/points/exchange-history - 获取积分兑换历史
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const userId = session.user.id
    const history = await getExchangeHistory(userId, 20)

    return NextResponse.json({
      success: true,
      data: history,
    })
  } catch (error: any) {
    console.error('获取兑换历史失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取兑换历史失败',
        detail: error?.message,
      },
      { status: 500 }
    )
  }
}
