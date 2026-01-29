import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { db } from '@/db'
import { vipRedeemCodes } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'


export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: number }> },
) {
  const session = await getServerSession(authOptions)
  // 权限检查
  const permissionCheck = await requirePermission('redeem.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const { id } = await context.params

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  try {
    const code = await db.query.vipRedeemCodes.findFirst({
      where: eq(vipRedeemCodes.id, id),
      with: {
        plan: {
          columns: { name: true },
        },
        history: {
          with: {
            user: { columns: { name: true, email: true } },
          },
        },
      },
    })

    if (!code) {
      return NextResponse.json({ error: 'Redeem code not found' }, { status: 404 })
    }

    return NextResponse.json(code)
  } catch (error) {
    console.error('Error fetching redeem code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: number }> },
  ) {
    const session = await getServerSession(authOptions)
    // 权限检查
    const permissionCheck = await requirePermission('redeem.delete')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await context.params

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    try {
      const [deletedCode] = await db.delete(vipRedeemCodes).where(eq(vipRedeemCodes.id, id)).returning()

      if (!deletedCode) {
        return NextResponse.json({ error: 'Redeem code not found' }, { status: 404 })
      }

      return NextResponse.json({ message: 'Redeem code deleted successfully' }, { status: 200 })
    } catch (error) {
      console.error('Error deleting redeem code:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: number }> }) {
  const session = await getServerSession(authOptions)
  // 权限检查
  const permissionCheck = await requirePermission('redeem.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const { id } = await context.params

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }
  try {
    const body = await request.json()
    // 校验字段
    const schema = z.object({
      type: z.string().min(1),
      planId: z.number().int().optional(),
      duration: z.number().int().optional(),
      days: z.number().int().optional(),
      vipLevel: z.number().int().optional(),
      maxUses: z.number().int().min(1).default(1),
      status: z.string().default('active'),
      expiresAt: z.string().optional(),
    })
    const validation = schema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 })
    }
    const { type, planId, duration, days, vipLevel, maxUses, status, expiresAt } = validation.data
    const updateData: any = {
      type,
      planId: type === 'plan' ? planId : null,
      duration: type === 'duration' ? duration : null,
      days: type === 'days' ? days : null,
      vipLevel: type === 'level' ? vipLevel : null,
      maxUses,
      status,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      updatedAt: new Date(),
    }
    const [updated] = await db.update(vipRedeemCodes).set(updateData).where(eq(vipRedeemCodes.id, id)).returning()
    if (!updated) {
      return NextResponse.json({ error: 'Redeem code not found' }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating redeem code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
