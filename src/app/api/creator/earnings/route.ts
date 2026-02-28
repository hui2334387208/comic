import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    // TODO: 从数据库查询真实收益数据
    // 这里返回模拟数据
    const earnings = {
      totalEarnings: 0,
      availableBalance: 0,
      withdrawn: 0,
      pending: 0,
    }

    const incomeBreakdown = {
      vipSubscription: 0,
      tips: 0,
      ads: 0,
      other: 0,
    }

    const transactions: any[] = []

    return NextResponse.json({
      success: true,
      data: {
        earnings,
        incomeBreakdown,
        transactions,
      },
    })
  } catch (error) {
    console.error('获取收益数据失败:', error)
    return NextResponse.json({ success: false, error: '获取数据失败' }, { status: 500 })
  }
}
