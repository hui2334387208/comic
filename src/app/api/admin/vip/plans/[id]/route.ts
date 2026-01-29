import { eq, count } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { db } from '@/db'
import { vipPlans, vipOrders, vipRedeemCodes } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'


const planSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: 'Price must be a valid number',
  }),
  originalPrice: z.string().optional(),
  duration: z.number().int().min(1, 'Duration must be at least 1 month'),
  status: z.boolean().optional(),
  features: z.array(z.any()).optional(),
  sortOrder: z.number().int().optional().default(0),
})

// 创建一个用于更新的、所有字段都可选的Schema
const partialPlanSchema = planSchema.partial()

// GET a single plan
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: number }> },
) {
  const session = await getServerSession(authOptions)
  // 权限检查
  const permissionCheck = await requirePermission('plan.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const plan = await db.query.vipPlans.findFirst({
      where: eq(vipPlans.id, id),
    })
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }
    return NextResponse.json(plan)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// UPDATE a plan
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: number }> },
) {
  const session = await getServerSession(authOptions)
  // 权限检查
  const permissionCheck = await requirePermission('plan.update')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const { id } = await context.params

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const validation = partialPlanSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 },
      )
    }

    const { price, originalPrice, ...dataToUpdate } = validation.data
    const finalUpdateData: { [key: string]: any } = { ...dataToUpdate }

    if (price !== undefined) {
      finalUpdateData.price = String(price)
    }
    if (originalPrice !== undefined) {
      finalUpdateData.originalPrice = String(originalPrice)
    }

    if (Object.keys(finalUpdateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    finalUpdateData.updatedAt = new Date()

    const [updatedPlan] = await db
      .update(vipPlans)
      .set(finalUpdateData)
      .where(eq(vipPlans.id, id))
      .returning()

    return NextResponse.json(updatedPlan)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// DELETE a plan with dependency checking
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: number }> },
) {
  const session = await getServerSession(authOptions)
  // 权限检查
  const permissionCheck = await requirePermission('plan.delete')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    // 1. 检查套餐是否存在
    const plan = await db.query.vipPlans.findFirst({
      where: eq(vipPlans.id, id),
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // 2. 检查依赖关系
    const [orderCount] = await db
      .select({ count: count() })
      .from(vipOrders)
      .where(eq(vipOrders.planId, id))

    const [codeCount] = await db
      .select({ count: count() })
      .from(vipRedeemCodes)
      .where(eq(vipRedeemCodes.planId, id))

    // 3. 如果有依赖数据，返回详细错误信息
    if (orderCount.count > 0 || codeCount.count > 0) {
      const dependencies = []
      if (orderCount.count > 0) {
        dependencies.push(`${orderCount.count} 个订单`)
      }
      if (codeCount.count > 0) {
        dependencies.push(`${codeCount.count} 个兑换码`)
      }

      return NextResponse.json({
        error: 'Cannot delete plan with dependencies',
        message: `套餐 "${plan.name}" 无法删除，存在依赖数据：${dependencies.join('、')}`,
        dependencies: {
          orders: orderCount.count,
          codes: codeCount.count,
        },
      }, { status: 400 })
    }

    // 4. 安全删除套餐
    await db.delete(vipPlans).where(eq(vipPlans.id, id))

    return NextResponse.json({
      message: `套餐 "${plan.name}" 删除成功`,
      deletedPlan: plan,
    })

  } catch (error) {
    console.error('Failed to delete VIP plan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
