import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { exchangePointsForCredits } from '@/lib/points-utils'

/**
 * POST /api/points/exchange - 积分兑换次数
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { credits, exchangeRate = 100 } = body

    if (!credits || credits <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: '兑换次数必须大于0',
        },
        { status: 400 }
      )
    }

    const result = await exchangePointsForCredits(userId, credits, exchangeRate)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        pointsSpent: result.pointsSpent,
        creditsReceived: result.creditsReceived,
        pointBalance: result.pointBalance,
        creditBalance: result.creditBalance,
        message: result.message,
      },
    })
  } catch (error: any) {
    console.error('兑换失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '兑换失败',
        detail: error?.message,
      },
      { status: 500 }
    )
  }
}
