import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getUserReferralStats, getActiveCampaign } from '@/lib/referral-utils'

/**
 * 获取我的邀请统计
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const userId = session.user.id

    const stats = await getUserReferralStats(userId)
    const campaign = await getActiveCampaign()

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        campaign: {
          inviterReward: campaign.inviterReward,
          inviteeReward: campaign.inviteeReward,
          requirementType: campaign.requirementType,
        },
      },
    })
  } catch (error: any) {
    console.error('获取邀请统计失败:', error)
    return NextResponse.json(
      { error: '获取邀请统计失败', detail: error?.message },
      { status: 500 }
    )
  }
}
