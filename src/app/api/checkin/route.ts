import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { dailyCheckIn, getCheckInStatus } from '@/lib/points-utils'

/**
 * GET /api/checkin - 获取签到状态
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const userId = session.user.id
    const status = await getCheckInStatus(userId)

    return NextResponse.json({
      success: true,
      data: status,
    })
  } catch (error: any) {
    console.error('获取签到状态失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取签到状态失败',
        detail: error?.message,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/checkin - 执行签到
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const userId = session.user.id
    const result = await dailyCheckIn(userId)

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
        points: result.points,
        consecutiveDays: result.consecutiveDays,
        balance: result.balance,
        message: result.message,
      },
    })
  } catch (error: any) {
    console.error('签到失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '签到失败',
        detail: error?.message,
      },
      { status: 500 }
    )
  }
}
