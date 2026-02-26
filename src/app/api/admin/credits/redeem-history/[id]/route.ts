import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db'
import { creditRedeemHistory } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'

const updateSchema = z.object({
  status: z.enum(['success', 'failed']).optional(),
  message: z.string().nullable().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  // 权限检查
  const permissionCheck = await requirePermission('credits-history.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const id = parseInt(params.id)

  try {
    const record = await db.query.creditRedeemHistory.findFirst({
      where: eq(creditRedeemHistory.id, id),
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
            credits: true,
          },
        },
      },
    })

    if (!record) {
      return NextResponse.json({ error: '记录不存在' }, { status: 404 })
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error fetching credit redeem history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  // 权限检查
  const permissionCheck = await requirePermission('credits-history.update')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const id = parseInt(params.id)

  try {
    const body = await request.json()
    const validation = updateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 },
      )
    }

    const [updatedRecord] = await db
      .update(creditRedeemHistory)
      .set(validation.data)
      .where(eq(creditRedeemHistory.id, id))
      .returning()

    if (!updatedRecord) {
      return NextResponse.json({ error: '记录不存在' }, { status: 404 })
    }

    return NextResponse.json(updatedRecord)
  } catch (error) {
    console.error('Failed to update credit redeem history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  // 权限检查
  const permissionCheck = await requirePermission('credits-history.delete')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const id = parseInt(params.id)

  try {
    await db.delete(creditRedeemHistory).where(eq(creditRedeemHistory.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete credit redeem history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
