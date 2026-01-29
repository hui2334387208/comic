import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { vipOrders } from '@/db/schema/vip'
import { authOptions } from '@/lib/authOptions'
import { sendOrderStatusUpdateEmail } from '@/lib/email'
import { requirePermission } from '@/lib/permission-middleware'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: number }> },
) {
  const { orderId } = await context.params
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

    const { reason } = await request.json()

    if (!reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 },
      )
    }

    const order = await db.query.vipOrders.findFirst({
      where: and(
        eq(vipOrders.id, Number(orderId)),
        eq(vipOrders.status, 'in_review'),
      ),
      with: {
        user: true,
        plan: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found or not in review' }, { status: 404 })
    }

    const now = new Date()
    await db
      .update(vipOrders)
      .set({
        status: 'rejected',
        adminNotes: reason,
        reviewedAt: now,
        reviewedBy: session.user.id,
        updatedAt: now,
      })
      .where(eq(vipOrders.id, Number(orderId)))

    // 发送邮件通知
    if (order.user && order.plan) {
      await sendOrderStatusUpdateEmail({
        email: order.user.email!,
        username: order.user.name!,
        orderNo: order.orderNo,
        planName: order.plan.name,
        status: 'rejected',
        rejectionReason: reason,
      })
    }

    return NextResponse.json({ message: 'Order rejected successfully' })

  } catch (error) {
    console.error(`Failed to reject order ${orderId}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
