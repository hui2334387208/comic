import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const commentId = parseInt(params.id)

    // TODO: 实现删除逻辑
    // 1. 验证评论所属作品是否属于当前用户
    // 2. 删除评论

    return NextResponse.json({
      success: true,
      message: '删除成功',
    })
  } catch (error) {
    console.error('删除评论失败:', error)
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 })
  }
}
