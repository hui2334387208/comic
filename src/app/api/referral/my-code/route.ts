import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getUserReferralCode, createReferralCode } from '@/lib/referral-utils'

/**
 * 获取我的邀请码
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const userId = session.user.id

    // 获取或创建邀请码
    let code = await getUserReferralCode(userId)

    if (!code) {
      const result = await createReferralCode(userId)
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 500 })
      }
      code = await getUserReferralCode(userId)
    }

    return NextResponse.json({
      success: true,
      data: code,
    })
  } catch (error: any) {
    console.error('获取邀请码失败:', error)
    return NextResponse.json(
      { error: '获取邀请码失败', detail: error?.message },
      { status: 500 }
    )
  }
}
