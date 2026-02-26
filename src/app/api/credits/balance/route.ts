import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getUserCredits } from '@/lib/credits-utils'

/**
 * 获取用户次数余额
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const credits = await getUserCredits(session.user.id)

    return NextResponse.json({
      success: true,
      data: {
        balance: credits.balance,
        totalRecharged: credits.totalRecharged,
        totalConsumed: credits.totalConsumed,
      },
    })
  } catch (error: any) {
    console.error('获取次数余额失败:', error)
    return NextResponse.json(
      { error: '获取余额失败', detail: error?.message },
      { status: 500 }
    )
  }
}
