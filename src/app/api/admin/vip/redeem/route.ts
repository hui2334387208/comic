import { randomBytes } from 'crypto'

import { desc, count } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { db } from '@/db'
import { vipRedeemCodes } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'


const generateCode = (length = 10) => {
  return randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
    .toUpperCase()
}

const redeemCodeSchema = z.object({
  type: z.string().min(1),
  planId: z.number().int().optional(),
  duration: z.number().int().optional(),
  days: z.number().int().optional(),
  vipLevel: z.number().int().optional(),
  maxUses: z.number().int().min(1).default(1),
  status: z.string().default('active'),
  expiresAt: z.string().optional(),
  quantity: z.number().int().min(1).max(100).default(1),
})

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  // 权限检查
  const permissionCheck = await requirePermission('redeem.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const offset = (page - 1) * limit

  try {
    const data = await db.query.vipRedeemCodes.findMany({
      orderBy: [desc(vipRedeemCodes.createdAt)],
      limit,
      offset,
      with: {
        plan: {
          columns: {
            name: true,
          },
        },
        history: {
          with: {
            user: {
              columns: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    const totalCountResult = await db.select({ count: count() }).from(vipRedeemCodes)
    const totalCount = totalCountResult[0].count

    return NextResponse.json({
      data,
      totalCount,
      page,
      limit,
    })
  } catch (error) {
    console.error('Error fetching vip redeem codes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  // 权限检查
  const permissionCheck = await requirePermission('redeem.create')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validation = redeemCodeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 },
      )
    }

    const { type, planId, duration, days, vipLevel, maxUses, status, expiresAt, quantity } = validation.data

    const codesToInsert = []
    for (let i = 0; i < quantity; i++) {
      codesToInsert.push({
        code: generateCode(),
        type,
        planId: type === 'plan' ? planId : null,
        duration: type === 'duration' ? duration : null,
        days: type === 'days' ? days : null,
        vipLevel: type === 'level' ? vipLevel : null,
        maxUses,
        status,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
    }

    const newCodes = await db
      .insert(vipRedeemCodes)
      .values(codesToInsert)
      .returning()

    return NextResponse.json(newCodes, { status: 201 })
  } catch (error) {
    console.error('Failed to create VIP redeem codes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
