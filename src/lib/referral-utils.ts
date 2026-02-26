import { db } from '@/db'
import {
  userReferralCodes,
  referralRelations,
  referralRewards,
  referralCampaigns,
} from '@/db/schema/referral'
import { eq, and, desc, sql } from 'drizzle-orm'
import { rechargeCredits } from './credits-utils'

/**
 * 生成唯一邀请码
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 去除易混淆字符
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * 为用户创建邀请码
 */
export async function createReferralCode(userId: string): Promise<{
  success: boolean
  code?: string
  message: string
}> {
  try {
    // 检查是否已有邀请码
    const existing = await db
      .select()
      .from(userReferralCodes)
      .where(eq(userReferralCodes.userId, userId))
      .limit(1)

    if (existing.length > 0) {
      return {
        success: true,
        code: existing[0].referralCode,
        message: '邀请码已存在',
      }
    }

    // 生成唯一邀请码
    let code = generateReferralCode()
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      const duplicate = await db
        .select()
        .from(userReferralCodes)
        .where(eq(userReferralCodes.referralCode, code))
        .limit(1)

      if (duplicate.length === 0) {
        break
      }

      code = generateReferralCode()
      attempts++
    }

    if (attempts >= maxAttempts) {
      return {
        success: false,
        message: '生成邀请码失败，请重试',
      }
    }

    // 创建邀请码记录
    await db.insert(userReferralCodes).values({
      userId,
      referralCode: code,
      totalInvites: 0,
      successfulInvites: 0,
      totalRewards: 0,
    })

    return {
      success: true,
      code,
      message: '邀请码创建成功',
    }
  } catch (error: any) {
    console.error('创建邀请码失败:', error)
    return {
      success: false,
      message: error.message || '创建邀请码失败',
    }
  }
}

/**
 * 获取用户的邀请码
 */
export async function getUserReferralCode(userId: string) {
  const [code] = await db
    .select()
    .from(userReferralCodes)
    .where(eq(userReferralCodes.userId, userId))
    .limit(1)

  if (!code) {
    // 如果没有邀请码，自动创建一个
    const result = await createReferralCode(userId)
    if (result.success && result.code) {
      const [newCode] = await db
        .select()
        .from(userReferralCodes)
        .where(eq(userReferralCodes.userId, userId))
        .limit(1)
      return newCode
    }
    return null
  }

  return code
}

/**
 * 验证邀请码是否有效
 */
export async function validateReferralCode(code: string): Promise<{
  valid: boolean
  userId?: string
  message: string
}> {
  try {
    const [referralCode] = await db
      .select()
      .from(userReferralCodes)
      .where(eq(userReferralCodes.referralCode, code.toUpperCase()))
      .limit(1)

    if (!referralCode) {
      return {
        valid: false,
        message: '邀请码不存在',
      }
    }

    // 可以在这里添加更多验证逻辑，比如检查活动是否有效、邀请人数限制等

    return {
      valid: true,
      userId: referralCode.userId,
      message: '邀请码有效',
    }
  } catch (error: any) {
    return {
      valid: false,
      message: error.message || '验证失败',
    }
  }
}

/**
 * 获取用户的邀请层级（从源头开始算）
 * 返回层级数：1表示一级，2表示二级，3表示三级，超过3返回4
 */
async function getUserInviteLevel(userId: string): Promise<number> {
  let level = 0
  let currentUserId = userId
  const maxLevel = 3 // 最多追溯3级

  while (level < maxLevel) {
    // 查找当前用户是否被别人邀请
    const [relation] = await db
      .select()
      .from(referralRelations)
      .where(eq(referralRelations.inviteeId, currentUserId))
      .limit(1)

    if (!relation) {
      // 没有上级，说明是源头用户
      break
    }

    level++
    currentUserId = relation.inviterId
  }

  return level
}

/**
 * 获取当前活动配置
 */
export async function getActiveCampaign() {
  const [campaign] = await db
    .select()
    .from(referralCampaigns)
    .where(
      and(
        eq(referralCampaigns.isActive, true),
        sql`(${referralCampaigns.startDate} IS NULL OR ${referralCampaigns.startDate} <= NOW())`,
        sql`(${referralCampaigns.endDate} IS NULL OR ${referralCampaigns.endDate} >= NOW())`
      )
    )
    .orderBy(desc(referralCampaigns.createdAt))
    .limit(1)

  // 如果没有活动，返回默认配置
  if (!campaign) {
    return {
      id: 0,
      name: '默认邀请活动',
      inviterReward: 10,          // 一级邀请奖励
      inviteeReward: 5,           // 被邀请人奖励
      requirementType: 'verified_email',
      isActive: true,
      maxInvitesPerUser: 3,       // 每人最多邀请3人（严格控制成本）
    }
  }

  return campaign
}

/**
 * 建立邀请关系
 */
export async function createReferralRelation(
  inviteeId: string,
  referralCode: string
): Promise<{
  success: boolean
  message: string
}> {
  try {
    // 验证邀请码
    const validation = await validateReferralCode(referralCode)
    if (!validation.valid || !validation.userId) {
      return {
        success: false,
        message: validation.message,
      }
    }

    const inviterId = validation.userId

    // 不能邀请自己
    if (inviterId === inviteeId) {
      return {
        success: false,
        message: '不能使用自己的邀请码',
      }
    }

    // 检查是否已经被邀请过
    const existing = await db
      .select()
      .from(referralRelations)
      .where(eq(referralRelations.inviteeId, inviteeId))
      .limit(1)

    if (existing.length > 0) {
      return {
        success: false,
        message: '您已经使用过邀请码了',
      }
    }

    // 获取活动配置
    const campaign = await getActiveCampaign()

    // 检查邀请人是否达到邀请上限
    if (campaign.maxInvitesPerUser) {
      const [inviterCode] = await db
        .select()
        .from(userReferralCodes)
        .where(eq(userReferralCodes.userId, inviterId))
        .limit(1)

      if (
        inviterCode &&
        inviterCode.totalInvites >= campaign.maxInvitesPerUser
      ) {
        return {
          success: false,
          message: '该邀请码已达到使用上限',
        }
      }
    }

    // 创建邀请关系
    await db.transaction(async (tx) => {
      // 插入邀请关系
      await tx.insert(referralRelations).values({
        inviterId,
        inviteeId,
        referralCode: referralCode.toUpperCase(),
        status: 'pending',
        inviterRewarded: false,
        inviteeRewarded: false,
        inviterRewardAmount: campaign.inviterReward,
        inviteeRewardAmount: campaign.inviteeReward,
      })

      // 更新邀请人的邀请统计
      await tx
        .update(userReferralCodes)
        .set({
          totalInvites: sql`${userReferralCodes.totalInvites} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(userReferralCodes.userId, inviterId))
    })

    return {
      success: true,
      message: '邀请关系建立成功',
    }
  } catch (error: any) {
    console.error('建立邀请关系失败:', error)
    return {
      success: false,
      message: error.message || '建立邀请关系失败',
    }
  }
}

/**
 * 完成邀请任务并发放奖励（支持三级裂变）
 */
export async function completeReferralTask(
  inviteeId: string,
  taskType: 'register' | 'first_comic' | 'verified_email' = 'register'
): Promise<{
  success: boolean
  message: string
  inviterReward?: number
  inviteeReward?: number
}> {
  try {
    // 查找邀请关系
    const [relation] = await db
      .select()
      .from(referralRelations)
      .where(
        and(
          eq(referralRelations.inviteeId, inviteeId),
          eq(referralRelations.status, 'pending')
        )
      )
      .limit(1)

    if (!relation) {
      return {
        success: false,
        message: '未找到待完成的邀请关系',
      }
    }

    // 获取活动配置
    const campaign = await getActiveCampaign()

    // 检查任务类型是否匹配
    if (campaign.requirementType !== taskType) {
      return {
        success: false,
        message: `当前活动要求完成 ${campaign.requirementType} 任务`,
      }
    }

    // 获取被邀请人的层级
    const inviteeLevel = await getUserInviteLevel(inviteeId)
    
    // 超过三级不发放奖励
    if (inviteeLevel >= 3) {
      await db
        .update(referralRelations)
        .set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(referralRelations.id, relation.id))

      return {
        success: true,
        message: '邀请层级超过限制，不发放奖励',
        inviterReward: 0,
        inviteeReward: 0,
      }
    }

    let inviterRewardIssued = false
    let inviteeRewardIssued = false
    let actualInviterReward = relation.inviterRewardAmount || 0
    let actualInviteeReward = relation.inviteeRewardAmount || 0

    // 根据层级调整奖励
    // 一级：100%奖励
    // 二级：50%奖励
    // 三级：不发放邀请人奖励
    if (inviteeLevel === 1) {
      actualInviterReward = Math.floor(actualInviterReward * 0.5) // 二级奖励减半
    } else if (inviteeLevel >= 2) {
      actualInviterReward = 0 // 三级及以上不发放邀请人奖励
    }

    await db.transaction(async (tx) => {
      // 更新邀请关系状态
      await tx
        .update(referralRelations)
        .set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
          inviterRewardAmount: actualInviterReward, // 更新实际奖励金额
        })
        .where(eq(referralRelations.id, relation.id))

      // 发放邀请人奖励
      if (!relation.inviterRewarded && actualInviterReward > 0) {
        const rechargeResult = await rechargeCredits(
          relation.inviterId,
          actualInviterReward,
          relation.id,
          'referral_inviter',
          `邀请好友奖励 ${actualInviterReward} 次 (${inviteeLevel === 0 ? '一级' : '二级'}邀请)`
        )

        if (rechargeResult.success) {
          await tx
            .update(referralRelations)
            .set({
              inviterRewarded: true,
            })
            .where(eq(referralRelations.id, relation.id))

          await tx.insert(referralRewards).values({
            relationId: relation.id,
            userId: relation.inviterId,
            rewardType: 'inviter',
            rewardAmount: actualInviterReward,
            status: 'issued',
            issuedAt: new Date(),
          })

          // 更新邀请人统计
          await tx
            .update(userReferralCodes)
            .set({
              successfulInvites: sql`${userReferralCodes.successfulInvites} + 1`,
              totalRewards: sql`${userReferralCodes.totalRewards} + ${actualInviterReward}`,
              updatedAt: new Date(),
            })
            .where(eq(userReferralCodes.userId, relation.inviterId))

          inviterRewardIssued = true
        }
      }

      // 发放被邀请人奖励（所有层级都发放）
      if (!relation.inviteeRewarded && actualInviteeReward > 0) {
        const rechargeResult = await rechargeCredits(
          relation.inviteeId,
          actualInviteeReward,
          relation.id,
          'referral_invitee',
          `新用户奖励 ${actualInviteeReward} 次`
        )

        if (rechargeResult.success) {
          await tx
            .update(referralRelations)
            .set({
              inviteeRewarded: true,
            })
            .where(eq(referralRelations.id, relation.id))

          await tx.insert(referralRewards).values({
            relationId: relation.id,
            userId: relation.inviteeId,
            rewardType: 'invitee',
            rewardAmount: actualInviteeReward,
            status: 'issued',
            issuedAt: new Date(),
          })

          inviteeRewardIssued = true
        }
      }
    })

    return {
      success: true,
      message: `邀请任务完成，奖励已发放 (${inviteeLevel === 0 ? '一级' : inviteeLevel === 1 ? '二级' : '三级'}邀请)`,
      inviterReward: inviterRewardIssued ? actualInviterReward : 0,
      inviteeReward: inviteeRewardIssued ? actualInviteeReward : 0,
    }
  } catch (error: any) {
    console.error('完成邀请任务失败:', error)
    return {
      success: false,
      message: error.message || '完成邀请任务失败',
    }
  }
}

/**
 * 获取用户的邀请统计
 */
export async function getUserReferralStats(userId: string) {
  const [code] = await db
    .select()
    .from(userReferralCodes)
    .where(eq(userReferralCodes.userId, userId))
    .limit(1)

  if (!code) {
    return {
      referralCode: null,
      totalInvites: 0,
      successfulInvites: 0,
      totalRewards: 0,
      invitees: [],
    }
  }

  // 获取邀请的用户列表
  const invitees = await db
    .select()
    .from(referralRelations)
    .where(eq(referralRelations.inviterId, userId))
    .orderBy(desc(referralRelations.createdAt))

  return {
    referralCode: code.referralCode,
    totalInvites: code.totalInvites,
    successfulInvites: code.successfulInvites,
    totalRewards: code.totalRewards,
    invitees,
  }
}
