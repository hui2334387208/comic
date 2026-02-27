import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getPointTransactions } from '@/lib/points-utils'

/**
 * GET /api/points/transactions - 获取积分交易记录
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const userId = session.user.id
    const transactions = await getPointTransactions(userId, 50)

    return NextResponse.json({
      success: true,
      data: transactions,
    })
  } catch (error: any) {
    console.error('获取积分交易记录失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取积分交易记录失败',
        detail: error?.message,
      },
      { status: 500 }
    )
  }
}
