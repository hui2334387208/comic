import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    // TODO: 从数据库查询营销活动
    const campaigns: any[] = []

    return NextResponse.json({
      success: true,
      data: { campaigns },
    })
  } catch (error) {
    console.error('获取营销活动失败:', error)
    return NextResponse.json({ success: false, error: '获取数据失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const { title, type, targetWork, budget, duration } = await request.json()

    if (!title || !targetWork) {
      return NextResponse.json({ success: false, error: '请填写完整信息' }, { status: 400 })
    }

    // TODO: 实现创建营销活动逻辑
    // 1. 验证预算是否足够
    // 2. 创建活动记录
    // 3. 扣除预算

    return NextResponse.json({
      success: true,
      message: '营销活动创建成功',
    })
  } catch (error) {
    console.error('创建营销活动失败:', error)
    return NextResponse.json({ success: false, error: '创建失败' }, { status: 500 })
  }
}
