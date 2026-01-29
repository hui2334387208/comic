import { eq, and } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { vipRedeemCodes, vipRedeemHistory, vipPlans, userVipStatus } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }
    const body = await request.json()
    const { code } = body
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: '请输入有效的兑换码' }, { status: 400 })
    }
    const userId = session.user.id
    const now = new Date()

    // 查找兑换码
    const redeemCode = await db
      .select({
        id: vipRedeemCodes.id,
        code: vipRedeemCodes.code,
        type: vipRedeemCodes.type,
        planId: vipRedeemCodes.planId,
        duration: vipRedeemCodes.duration,
        days: vipRedeemCodes.days,
        vipLevel: vipRedeemCodes.vipLevel,
        maxUses: vipRedeemCodes.maxUses,
        usedCount: vipRedeemCodes.usedCount,
        status: vipRedeemCodes.status,
        expiresAt: vipRedeemCodes.expiresAt,
      })
      .from(vipRedeemCodes)
      .where(eq(vipRedeemCodes.code, code.trim()))
      .limit(1)

    if (!redeemCode.length) {
      return NextResponse.json({ error: '兑换码不存在' }, { status: 404 })
    }
    const codeData = redeemCode[0]

    // 检查兑换码是否可用
    if (codeData.status !== 'active') {
      return NextResponse.json({ error: '兑换码不可用' }, { status: 400 })
    }
    if (codeData.expiresAt && codeData.expiresAt < now) {
      return NextResponse.json({ error: '兑换码已过期' }, { status: 400 })
    }
    if ((codeData.usedCount || 0) >= (codeData.maxUses || 1)) {
      return NextResponse.json({ error: '兑换码使用次数已达上限' }, { status: 400 })
    }

    // 检查用户是否已经使用过这个兑换码
    const existingRedeem = await db
      .select()
      .from(vipRedeemHistory)
      .where(
        and(
          eq(vipRedeemHistory.codeId, codeData.id),
          eq(vipRedeemHistory.userId, userId),
        ),
      )
      .limit(1)
    if (existingRedeem.length > 0) {
      return NextResponse.json({ error: '您已经使用过这个兑换码' }, { status: 400 })
    }

    // 获取套餐名（如有）
    let planName = ''
    if (codeData.planId) {
      const plan = await db
        .select({ name: vipPlans.name })
        .from(vipPlans)
        .where(eq(vipPlans.id, codeData.planId))
        .limit(1)
      if (plan.length) planName = plan[0].name
    }

    // 计算有效期（月/天）
    let addMonths = 0, addDays = 0
    if (codeData.type === 'plan' || codeData.type === 'duration') {
      addMonths = codeData.duration && codeData.duration > 0 ? codeData.duration : 1
    } else if (codeData.type === 'days') {
      addDays = codeData.days && codeData.days > 0 ? codeData.days : 1
    }

    // 开始事务
    await db.transaction(async (tx) => {
      // 计算新的使用次数和状态
      const newUsedCount = (codeData.usedCount || 0) + 1
      let newStatus = codeData.status
      if (newUsedCount >= (codeData.maxUses || 1)) {
        newStatus = 'used_up'
      } else if (codeData.expiresAt && new Date(codeData.expiresAt).getTime() < Date.now()) {
        newStatus = 'expired'
      } else {
        newStatus = 'active'
      }
      // 更新兑换码使用次数和状态
      await tx
        .update(vipRedeemCodes)
        .set({ usedCount: newUsedCount, status: newStatus })
        .where(eq(vipRedeemCodes.id, codeData.id))

      // 写入兑换历史
      await tx
        .insert(vipRedeemHistory)
        .values({
          codeId: codeData.id,
          userId,
          status: 'success',
          message: '兑换成功！已激活会员',
          redeemedAt: new Date(),
          snapshot: {
            code: codeData.code,
            type: codeData.type,
            planId: codeData.planId,
            planName,
            duration: codeData.duration,
            days: codeData.days,
            vipLevel: codeData.vipLevel,
          },
        })

      // 更新/创建用户VIP状态
      const currentVipStatus = await tx
        .select()
        .from(userVipStatus)
        .where(eq(userVipStatus.userId, userId))
        .limit(1)
      const expireDate = new Date()
      if (addMonths > 0) expireDate.setMonth(expireDate.getMonth() + addMonths)
      if (addDays > 0) expireDate.setDate(expireDate.getDate() + addDays)
      if (currentVipStatus.length > 0) {
        const currentExpireDate = currentVipStatus[0].vipExpireDate
        let newExpireDate = expireDate
        if (currentExpireDate && currentExpireDate > now) {
          newExpireDate = new Date(currentExpireDate)
          if (addMonths > 0) newExpireDate.setMonth(newExpireDate.getMonth() + addMonths)
          if (addDays > 0) newExpireDate.setDate(newExpireDate.getDate() + addDays)
        }
        await tx
          .update(userVipStatus)
          .set({
            isVip: true,
            vipExpireDate: newExpireDate,
            updatedAt: now,
          })
          .where(eq(userVipStatus.userId, userId))
      } else {
        await tx
          .insert(userVipStatus)
          .values({
            userId,
            isVip: true,
            vipExpireDate: expireDate,
          })
      }
    })

    return NextResponse.json({
      message: `兑换成功！${planName ? `已激活${planName}，` : ''}${addMonths ? `有效期${addMonths}个月` : ''}${addDays ? `有效期${addDays}天` : ''}`,
      planName,
      duration: addMonths,
      days: addDays,
      type: codeData.type,
      vipLevel: codeData.vipLevel,
    })
  } catch (error) {
    console.error('兑换失败:', error)
    return NextResponse.json(
      { error: '兑换失败，请稍后重试' },
      { status: 500 },
    )
  }
}
