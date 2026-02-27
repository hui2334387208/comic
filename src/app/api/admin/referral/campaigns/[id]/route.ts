import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { referralCampaigns } from '@/db/schema/referral'
import { eq } from 'drizzle-orm'
import { requirePermission } from '@/lib/permission-middleware'

// 获取单个邀请活动
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('referral-campaign.read')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const id = parseInt(params.id)
    const [campaign] = await db
      .select()
      .from(referralCampaigns)
      .where(eq(referralCampaigns.id, id))

    if (!campaign) {
      return NextResponse.json({ error: '活动不存在' }, { status: 404 })
    }

    return NextResponse.json({ campaign })
  } catch (error: any) {
    console.error('获取邀请活动失败:', error)
    return NextResponse.json(
      { error: error.message || '获取邀请活动失败' },
      { status: 500 }
    )
  }
}

// 更新邀请活动
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('referral-campaign.update')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const id = parseInt(params.id)
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
      .update(referralCampaigns)
      .set({
        name,
        description,
        inviterReward: Number(inviterReward),
        inviteeReward: Number(inviteeReward),
        requirementType: requirementType || 'verified_email',
        isActive: isActive || false,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        maxInvitesPerUser: maxInvitesPerUser ? Number(maxInvitesPerUser) : null,
        updatedAt: new Date(),
      })
      .where(eq(referralCampaigns.id, id))
      .returning()

    if (!campaign) {
      return NextResponse.json({ error: '活动不存在' }, { status: 404 })
    }

    return NextResponse.json({ campaign, message: '更新成功' })
  } catch (error: any) {
    console.error('更新邀请活动失败:', error)
    return NextResponse.json(
      { error: error.message || '更新邀请活动失败' },
      { status: 500 }
    )
  }
}

// 删除邀请活动
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('referral-campaign.delete')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const id = parseInt(params.id)

    // 检查活动是否存在
    const [existing] = await db
      .select()
      .from(referralCampaigns)
      .where(eq(referralCampaigns.id, id))

    if (!existing) {
      return NextResponse.json({ error: '活动不存在' }, { status: 404 })
    }

    // 删除活动
    await db
      .delete(referralCampaigns)
      .where(eq(referralCampaigns.id, id))

    return NextResponse.json({ message: '删除成功' })
  } catch (error: any) {
    console.error('删除邀请活动失败:', error)
    return NextResponse.json(
      { error: error.message || '删除邀请活动失败' },
      { status: 500 }
    )
  }
}
