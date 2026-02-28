import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'

    // TODO: 从数据库查询评论
    // 这里返回模拟数据
    const comments: any[] = []

    return NextResponse.json({
      success: true,
      data: { comments },
    })
  } catch (error) {
    console.error('获取评论失败:', error)
    return NextResponse.json({ success: false, error: '获取数据失败' }, { status: 500 })
  }
}
