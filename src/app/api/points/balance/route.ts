import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getUserPoints } from '@/lib/points-utils'

/**
 * GET /api/points/balance - 获取用户积分余额
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const userId = session.user.id
    const points = await getUserPoints(userId)

    return NextResponse.json({
      success: true,
      data: points,
    })
  } catch (error: any) {
    console.error('获取积分余额失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取积分余额失败',
        detail: error?.message,
      },
      { status: 500 }
    )
  }
}
