import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { consumeCredits } from '@/lib/credits-utils'

/**
 * 消费次数（生成图片后调用）
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { comicId, imageCount } = body || {}

    if (!comicId || !imageCount || imageCount <= 0) {
      return NextResponse.json(
        { error: '请提供有效的参数' },
        { status: 400 }
      )
    }

    // 消费次数
    const result = await consumeCredits(
      session.user.id,
      imageCount,
      comicId,
      'comic_generation',
      `生成漫画 #${comicId}，共${imageCount}张图片`
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        consumed: imageCount,
        balance: result.balance,
      },
    })
  } catch (error: any) {
    console.error('消费次数失败:', error)
    return NextResponse.json(
      { error: '消费失败', detail: error?.message },
      { status: 500 }
    )
  }
}
