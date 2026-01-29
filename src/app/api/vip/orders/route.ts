import { eq, desc } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { vipOrders, vipPlans } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const userId = session.user.id

    // 获取用户的订单列表
    const orders = await db
      .select({
        id: vipOrders.id,
        orderNo: vipOrders.orderNo,
        amount: vipOrders.amount,
        status: vipOrders.status,
        paymentMethod: vipOrders.paymentMethod,
        autoRenew: vipOrders.autoRenew,
        createdAt: vipOrders.createdAt,
        paidAt: vipOrders.paidAt,
        expireAt: vipOrders.expireAt,
        planName: vipPlans.name,
      })
      .from(vipOrders)
      .leftJoin(vipPlans, eq(vipOrders.planId, vipPlans.id))
      .where(eq(vipOrders.userId, userId))
      .orderBy(desc(vipOrders.createdAt))

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('获取订单失败:', error)
    return NextResponse.json(
      { error: '获取订单失败' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, autoRenew = false } = body

    if (!planId) {
      return NextResponse.json({ error: '缺少套餐ID' }, { status: 400 })
    }

    // 获取套餐信息
    const plan = await db
      .select()
      .from(vipPlans)
      .where(eq(vipPlans.id, planId))
      .limit(1)

    if (!plan.length) {
      return NextResponse.json({ error: '套餐不存在' }, { status: 404 })
    }

    const selectedPlan = plan[0]
    const orderNo = `VIP${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`

    // 计算价格（自动续费9折）
    const finalPrice = autoRenew
      ? Number(selectedPlan.price) * 0.9
      : Number(selectedPlan.price)

    // 创建订单
    const [newOrder] = await db
      .insert(vipOrders)
      .values({
        orderNo,
        userId: session.user.id,
        planId: selectedPlan.id,
        amount: finalPrice.toString(),
        autoRenew,
        status: 'pending',
      })
      .returning()

    return NextResponse.json({
      order: newOrder,
      message: '订单创建成功',
    })
  } catch (error) {
    console.error('创建订单失败:', error)
    return NextResponse.json(
      { error: '创建订单失败' },
      { status: 500 },
    )
  }
}
