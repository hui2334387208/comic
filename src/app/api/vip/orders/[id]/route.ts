import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { vipOrders, vipPlans, users } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)

    const { id: orderId } = await context.params

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    if (!orderId) {
      return NextResponse.json({ error: '无效的订单ID' }, { status: 400 })
    }

    // 获取订单详情，并验证订单是否属于当前用户
    const orderDetails = await db
      .select({
        id: vipOrders.id,
        orderNo: vipOrders.orderNo,
        amount: vipOrders.amount,
        status: vipOrders.status,
        createdAt: vipOrders.createdAt,
        planName: vipPlans.name,
        planDuration: vipPlans.duration,
      })
      .from(vipOrders)
      .leftJoin(vipPlans, eq(vipOrders.planId, vipPlans.id))
      .where(eq(vipOrders.orderNo, orderId))
      .limit(1)

    if (!orderDetails.length) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    const order = orderDetails[0]

    // 验证订单是否属于当前登录用户
    const orderOwner = await db.select({ userId: vipOrders.userId }).from(vipOrders).where(eq(vipOrders.orderNo, orderId))
    if (orderOwner[0].userId !== session.user.id) {
        return NextResponse.json({ error: '无权访问此订单' }, { status: 403 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('获取订单详情失败:', error)
    return NextResponse.json(
      { error: '获取订单详情失败' },
      { status: 500 },
    )
  }
}
