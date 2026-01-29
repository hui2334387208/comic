import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { users } from '@/db/schema'
import { vipOrders, vipPlans, userVipStatus } from '@/db/schema/vip'
import { authOptions } from '@/lib/authOptions'
import { sendOrderStatusUpdateEmail } from '@/lib/email'
import { requirePermission } from '@/lib/permission-middleware'


export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: number }> },
) {
  try {
    const session = await getServerSession(authOptions)
    // 权限检查
    const permissionCheck = await requirePermission('order.update')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { orderId } = await context.params
    const { adminNotes } = await request.json()

    const order = await db.query.vipOrders.findFirst({
      where: and(
        eq(vipOrders.id, orderId),
        eq(vipOrders.status, 'in_review'),
      ),
      with: {
        user: true,
        plan: true,
      },
    })

    if (!order || !order.user || !order.plan) {
      return NextResponse.json({ error: 'Order not found or not in review' }, { status: 404 })
    }

    const now = new Date()

    await db.transaction(async (tx) => {
      // 1. 计算新的到期时间
      const currentUserVipStatus = await tx.query.userVipStatus.findFirst({
        where: eq(userVipStatus.userId, order.user.id),
      })

      let newExpiryDate: Date
      if (currentUserVipStatus && currentUserVipStatus.isVip && currentUserVipStatus.vipExpireDate && currentUserVipStatus.vipExpireDate > now) {
        // 如果当前是VIP且未过期，在现有基础上延长
        newExpiryDate = new Date(currentUserVipStatus.vipExpireDate)
      } else {
        // 否则，从现在开始计算
        newExpiryDate = new Date(now)
      }
      newExpiryDate.setMonth(newExpiryDate.getMonth() + order.plan.duration)

      // 2. 更新订单状态
      await tx.update(vipOrders)
        .set({
          status: 'completed',
          reviewedAt: now,
          reviewedBy: session.user.id,
          updatedAt: now,
          expireAt: newExpiryDate,
          adminNotes,
        })
        .where(eq(vipOrders.id, orderId))

      // 3. 更新用户VIP状态
      // 使用 onConflictDoUpdate (UPSERT)
      await tx.insert(userVipStatus)
        .values({
          userId: order.user.id,
          isVip: true,
          vipExpireDate: newExpiryDate,
          lastRenewalDate: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: userVipStatus.userId,
          set: {
            isVip: true,
            vipExpireDate: newExpiryDate,
            lastRenewalDate: now,
            updatedAt: now,
          },
        })
    })

    // 4. 发送邮件通知
    await sendOrderStatusUpdateEmail({
      email: order.user.email!,
      username: order.user.name!,
      orderNo: order.orderNo,
      planName: order.plan.name,
      status: 'passed',
    })

    return NextResponse.json({ message: 'Order approved successfully' })

  } catch (error) {
    console.error('Error approving order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
