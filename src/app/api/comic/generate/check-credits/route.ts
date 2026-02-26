import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { checkCreditsBalance } from '@/lib/credits-utils'

/**
 * 检查用户次数是否足够生成漫画
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
    const { volumes } = body || {}

    if (!volumes || !Array.isArray(volumes)) {
      return NextResponse.json(
        { error: '请提供有效的漫画结构' },
        { status: 400 }
      )
    }

    // 计算需要生成的图片数量
    let totalImages = 1 // 封面图片

    for (const volume of volumes) {
      if (volume.episodes && Array.isArray(volume.episodes)) {
        for (const episode of volume.episodes) {
          if (episode.pages && Array.isArray(episode.pages)) {
            totalImages += episode.pages.length // 每页一张图片
          }
        }
      }
    }

    // 检查余额
    const check = await checkCreditsBalance(session.user.id, totalImages)

    return NextResponse.json({
      success: true,
      data: {
        required: totalImages,
        balance: check.balance,
        sufficient: check.sufficient,
        shortage: check.shortage,
        breakdown: {
          cover: 1,
          pages: totalImages - 1,
        },
      },
    }, { status: check.sufficient ? 200 : 402 }) // 402 Payment Required
  } catch (error: any) {
    console.error('检查次数失败:', error)
    return NextResponse.json(
      { error: '检查失败', detail: error?.message },
      { status: 500 }
    )
  }
}
