import { NextRequest, NextResponse } from 'next/server'
import { validateReferralCode } from '@/lib/referral-utils'

/**
 * 验证邀请码
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: '请提供邀请码' }, { status: 400 })
    }

    const result = await validateReferralCode(code)

    return NextResponse.json({
      success: result.valid,
      message: result.message,
    })
  } catch (error: any) {
    console.error('验证邀请码失败:', error)
    return NextResponse.json(
      { error: '验证邀请码失败', detail: error?.message },
      { status: 500 }
    )
  }
}
