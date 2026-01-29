import { randomBytes } from 'crypto'

import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { vipOrders, userVipStatus, vipPlans, users } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'


export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  // 权限检查
  const permissionCheck = await requirePermission('member.update')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const { userId, planId, adminNotes } = await request.json()

  if (!userId || !planId) {
    return NextResponse.json(
      { error: 'User ID and Plan ID are required' },
      { status: 400 },
    )
  }

  try {
    const plan = await db.query.vipPlans.findFirst({
      where: eq(vipPlans.id, planId),
    })
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Use a database transaction to ensure atomicity
    const newOrder = await db.transaction(async (tx) => {
      // 1. Create a new, already-paid order
      const orderNo = `MANUAL-${dayjs().format(
        'YYYYMMDD',
      )}-${randomBytes(4).toString('hex').toUpperCase()}`

      const [createdOrder] = await tx
        .insert(vipOrders)
        .values({
          orderNo,
          userId,
          planId,
          amount: plan.price,
          status: 'paid',
          paymentMethod: 'manual',
          paidAt: new Date(),
          adminNotes: `Granted by admin: ${session.user.email}. Notes: ${adminNotes || 'N/A'}`,
        })
        .returning()

      // 2. Update or create user's VIP status
      const currentUserVip = await tx.query.userVipStatus.findFirst({
        where: eq(userVipStatus.userId, userId),
      })

      const planDuration = plan.duration // duration in months
      const now = dayjs()
      let newExpiryDate

      if (currentUserVip && dayjs(currentUserVip.vipExpireDate).isAfter(now)) {
        newExpiryDate = dayjs(currentUserVip.vipExpireDate)
          .add(planDuration, 'month')
          .toDate()
      } else {
        newExpiryDate = now.add(planDuration, 'month').toDate()
      }

      await tx
        .insert(userVipStatus)
        .values({
          userId,
          isVip: true,
          vipExpireDate: newExpiryDate,
          lastRenewalDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userVipStatus.userId,
          set: {
            isVip: true,
            vipExpireDate: newExpiryDate,
            lastRenewalDate: new Date(),
            updatedAt: new Date(),
          },
        })

      return createdOrder
    })

    return NextResponse.json({
      message: 'VIP granted successfully.',
      order: newOrder,
    })
  } catch (error) {
    console.error(`Failed to grant VIP to user ${userId}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
