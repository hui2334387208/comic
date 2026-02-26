import { randomBytes } from 'crypto'

import { desc, count, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { db } from '@/db'
import { creditRedeemCodes } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'

const generateCode = (length = 10) => {
  return randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
    .toUpperCase()
}

const redeemCodeSchema = z.object({
  code: z.string().min(6).max(50),
  credits: z.number().int().min(1),
  maxUses: z.number().int().min(1),
  usedCount: z.number().int().min(0).default(0),
  status: z.string().default('active'),
  expiresAt: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  // 权限检查
  const permissionCheck = await requirePermission('credits-redeem.read')(request)
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
    const data = await db.query.creditRedeemCodes.findMany({
      orderBy: [desc(creditRedeemCodes.createdAt)],
      limit,
      offset,
      with: {
        creator: {
          columns: {
            name: true,
            email: true,
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

    const totalCountResult = await db.select({ count: count() }).from(creditRedeemCodes)
    const totalCount = totalCountResult[0].count

    return NextResponse.json({
      data,
      totalCount,
      page,
      limit,
    })
  } catch (error) {
    console.error('Error fetching credit redeem codes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  // 权限检查
  const permissionCheck = await requirePermission('credits-redeem.create')(request)
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

    const { code, credits, maxUses, usedCount, status, expiresAt } = validation.data

    const upperCode = code.trim().toUpperCase()

    // 检查兑换码是否已存在
    const [existing] = await db
      .select()
      .from(creditRedeemCodes)
      .where(eq(creditRedeemCodes.code, upperCode))
      .limit(1)

    if (existing) {
      return NextResponse.json(
        { error: '兑换码已存在' },
        { status: 400 }
      )
    }

    const [newCode] = await db
      .insert(creditRedeemCodes)
      .values({
        code: upperCode,
        credits,
        maxUses,
        usedCount: usedCount || 0,
        status,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: session.user.id,
      })
      .returning()

    return NextResponse.json(newCode, { status: 201 })
  } catch (error) {
    console.error('Failed to create credit redeem codes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
