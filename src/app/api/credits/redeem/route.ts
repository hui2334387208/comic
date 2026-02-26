import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { creditRedeemCodes, creditRedeemHistory } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { rechargeCredits } from '@/lib/credits-utils'

/**
 * 兑换码兑换
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
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: '请输入有效的兑换码' },
        { status: 400 }
      )
    }

    // 查询兑换码
    const [redeemCode] = await db
      .select()
      .from(creditRedeemCodes)
      .where(eq(creditRedeemCodes.code, code.trim().toUpperCase()))
      .limit(1)

    if (!redeemCode) {
      return NextResponse.json(
        { error: '兑换码不存在' },
        { status: 404 }
      )
    }

    // 检查兑换码状态
    if (redeemCode.status !== 'active') {
      return NextResponse.json(
        { error: '兑换码已失效' },
        { status: 400 }
      )
    }

    // 检查是否过期
    if (redeemCode.expiresAt && new Date(redeemCode.expiresAt) < new Date()) {
      // 更新状态为过期
      await db
        .update(creditRedeemCodes)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(creditRedeemCodes.id, redeemCode.id))

      return NextResponse.json(
        { error: '兑换码已过期' },
        { status: 400 }
      )
    }

    // 检查使用次数
    if (redeemCode.usedCount >= redeemCode.maxUses) {
      // 更新状态为已用完
      await db
        .update(creditRedeemCodes)
        .set({ status: 'used_up', updatedAt: new Date() })
        .where(eq(creditRedeemCodes.id, redeemCode.id))

      return NextResponse.json(
        { error: '兑换码已被使用完' },
        { status: 400 }
      )
    }

    // 检查用户是否已经使用过此兑换码
    const [existingHistory] = await db
      .select()
      .from(creditRedeemHistory)
      .where(
        and(
          eq(creditRedeemHistory.codeId, redeemCode.id),
          eq(creditRedeemHistory.userId, session.user.id),
          eq(creditRedeemHistory.status, 'success')
        )
      )
      .limit(1)

    if (existingHistory) {
      return NextResponse.json(
        { error: '您已经使用过此兑换码' },
        { status: 400 }
      )
    }

    // 开始事务：充值 + 更新兑换码 + 记录历史
    const result = await db.transaction(async (tx) => {
      // 充值次数
      const rechargeResult = await rechargeCredits(
        session.user.id,
        redeemCode.credits,
        redeemCode.id,
        'redeem_code',
        `兑换码充值：${code}`
      )

      if (!rechargeResult.success) {
        throw new Error(rechargeResult.message)
      }

      // 更新兑换码使用次数
      const newUsedCount = redeemCode.usedCount + 1
      const newStatus = newUsedCount >= redeemCode.maxUses ? 'used_up' : 'active'

      await tx
        .update(creditRedeemCodes)
        .set({
          usedCount: newUsedCount,
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(creditRedeemCodes.id, redeemCode.id))

      // 记录兑换历史
      await tx.insert(creditRedeemHistory).values({
        codeId: redeemCode.id,
        userId: session.user.id,
        credits: redeemCode.credits,
        status: 'success',
        message: '兑换成功',
      })

      return rechargeResult
    })

    return NextResponse.json({
      success: true,
      message: `成功兑换${redeemCode.credits}次`,
      data: {
        credits: redeemCode.credits,
        balance: result.balance,
      },
    })
  } catch (error: any) {
    console.error('兑换失败:', error)
    
    // 记录失败历史（如果能获取到兑换码ID）
    try {
      const body = await request.json()
      const { code } = body
      const [redeemCode] = await db
        .select()
        .from(creditRedeemCodes)
        .where(eq(creditRedeemCodes.code, code?.trim().toUpperCase()))
        .limit(1)

      if (redeemCode && session?.user?.id) {
        await db.insert(creditRedeemHistory).values({
          codeId: redeemCode.id,
          userId: session.user.id,
          credits: 0,
          status: 'failed',
          message: error.message || '兑换失败',
        })
      }
    } catch (e) {
      // 忽略记录失败的错误
    }

    return NextResponse.json(
      { error: '兑换失败', detail: error?.message },
      { status: 500 }
    )
  }
}
