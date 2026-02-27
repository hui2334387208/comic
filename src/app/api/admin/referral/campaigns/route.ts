import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { referralCampaigns } from '@/db/schema/referral'
import { desc } from 'drizzle-orm'
import { requirePermission } from '@/lib/permission-middleware'

// 获取所有邀请活动
export async function GET(request: NextRequest) {
  const permissionCheck = await requirePermission('referral-campaign.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const campaigns = await db
      .select()
      .from(referralCampaigns)
      .orderBy(desc(referralCampaigns.createdAt))

    return NextResponse.json({ campaigns })
  } catch (error: any) {
    console.error('获取邀请活动失败:', error)
    return NextResponse.json(
      { error: error.message || '获取邀请活动失败' },
      { status: 500 }
    )
  }
}

// 创建新的邀请活动
export async function POST(request: NextRequest) {
  const permissionCheck = await requirePermission('referral-campaign.create')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const body = await request.json()
    const {
      name,
      description,
      inviterReward,
      inviteeReward,
      requirementType,
      isActive,
      startDate,
      endDate,
      maxInvitesPerUser,
    } = body

    // 验证必填字段
    if (!name || inviterReward === undefined || inviteeReward === undefined) {
      return NextResponse.json(
        { error: '请填写必填字段' },
        { status: 400 }
      )
    }

    // 如果设置为激活，先将其他活动设为非激活
    if (isActive) {
      await db
        .update(referralCampaigns)
        .set({ isActive: false, updatedAt: new Date() })
    }

    const [campaign] = await db
      .insert(referralCampaigns)
      .values({
        name,
        description,
        inviterReward: Number(inviterReward),
        inviteeReward: Number(inviteeReward),
        requirementType: requirementType || 'verified_email',
        isActive: isActive || false,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        maxInvitesPerUser: maxInvitesPerUser ? Number(maxInvitesPerUser) : null,
      })
      .returning()

    return NextResponse.json({ campaign, message: '创建成功' })
  } catch (error: any) {
    console.error('创建邀请活动失败:', error)
    return NextResponse.json(
      { error: error.message || '创建邀请活动失败' },
      { status: 500 }
    )
  }
}
