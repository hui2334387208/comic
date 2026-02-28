import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const { amount } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: '无效的提现金额' }, { status: 400 })
    }

    // TODO: 实现提现逻辑
    // 1. 检查余额是否足够
    // 2. 创建提现记录
    // 3. 更新余额
    // 4. 发送通知

    return NextResponse.json({
      success: true,
      message: '提现申请已提交，预计3-5个工作日到账',
    })
  } catch (error) {
    console.error('提现失败:', error)
    return NextResponse.json({ success: false, error: '提现失败' }, { status: 500 })
  }
}
