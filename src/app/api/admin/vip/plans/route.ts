import { and, desc, eq, ilike, or } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { db } from '@/db'
import { vipPlans } from '@/db/schema'
import { users } from '@/db/schema/users'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'


// VIP功能特性验证schema
const vipFeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean(),
})

const planSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: 'Price must be a valid number',
  }),
  originalPrice: z.string().optional(),
  duration: z.number().int().min(1, 'Duration must be at least 1 month'),
  status: z.boolean().default(true),
  features: z.array(vipFeatureSchema).optional(),
  sortOrder: z.number().int().optional().default(0),
})

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  // 权限检查
  const permissionCheck = await requirePermission('plan.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  try {
    const data = await db.select({
      id: vipPlans.id,
      name: vipPlans.name,
      price: vipPlans.price,
      originalPrice: vipPlans.originalPrice,
      duration: vipPlans.duration,
      status: vipPlans.status,
      sortOrder: vipPlans.sortOrder,
      createdAt: vipPlans.createdAt,
      operator: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(vipPlans)
    .leftJoin(users, eq(vipPlans.operatorId, users.id))
    .orderBy(desc(vipPlans.createdAt))

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching vip plans:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  // 权限检查
  const permissionCheck = await requirePermission('plan.create')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validation = planSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 },
      )
    }

    const { price, originalPrice, features, ...rest } = validation.data

    const [newPlan] = await db
      .insert(vipPlans)
      .values({
        ...rest,
        price: String(price),
        originalPrice: originalPrice || null,
        features: features || null,
        operatorId: session.user.id,
      })
      .returning()

    return NextResponse.json(newPlan, { status: 201 })
  } catch (error) {
    console.error('Failed to create VIP plan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
