import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const { commentId, content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: '回复内容不能为空' }, { status: 400 })
    }

    // TODO: 实现回复逻辑
    // 1. 创建回复记录
    // 2. 更新评论状态
    // 3. 发送通知给评论者

    return NextResponse.json({
      success: true,
      message: '回复成功',
    })
  } catch (error) {
    console.error('回复失败:', error)
    return NextResponse.json({ success: false, error: '回复失败' }, { status: 500 })
  }
}
