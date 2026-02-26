import { desc, count, eq, and, or, ilike } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { db } from '@/db'
import { creditRedeemHistory, creditRedeemCodes, users } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'

const redeemHistorySchema = z.object({
  codeId: z.number().int().positive(),
  userId: z.string().min(1),
  credits: z.number().int().positive(),
  status: z.enum(['success', 'failed']),
  message: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  // 权限检查
  const permissionCheck = await requirePermission('credits-history.read')(request)
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
    const data = await db.query.creditRedeemHistory.findMany({
      orderBy: [desc(creditRedeemHistory.redeemedAt)],
      limit,
      offset,
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        redeemCode: {
          columns: {
            code: true,
          },
        },
      },
    })

    const totalCountResult = await db.select({ count: count() }).from(creditRedeemHistory)
    const totalCount = totalCountResult[0].count

    // 格式化数据
    const formattedData = data.map(item => ({
      id: item.id,
      code: item.redeemCode?.code || '未知',
      credits: item.credits,
      status: item.status,
      message: item.message,
      redeemedAt: item.redeemedAt,
      user: item.user,
    }))

    return NextResponse.json({
      data: formattedData,
      totalCount,
      page,
      limit,
    })
  } catch (error) {
    console.error('Error fetching credit redeem history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  // 权限检查
  const permissionCheck = await requirePermission('credits-history.create')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validation = redeemHistorySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 },
      )
    }

    const { codeId, userId, credits, status, message } = validation.data

    const [newRecord] = await db
      .insert(creditRedeemHistory)
      .values({
        codeId,
        userId,
        credits,
        status,
        message: message || null,
      })
      .returning()

    return NextResponse.json(newRecord, { status: 201 })
  } catch (error) {
    console.error('Failed to create credit redeem history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
