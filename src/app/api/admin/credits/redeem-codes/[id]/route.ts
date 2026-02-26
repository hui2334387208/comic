import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { eq, and, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db'
import { creditRedeemCodes } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'

const updateSchema = z.object({
  code: z.string().min(6).max(50).optional(),
  credits: z.number().int().min(1).optional(),
  maxUses: z.number().int().min(1).optional(),
  usedCount: z.number().int().min(0).optional(),
  status: z.string().optional(),
  expiresAt: z.string().nullable().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  // 权限检查
  const permissionCheck = await requirePermission('credits-redeem.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const id = parseInt(params.id)

  try {
    const code = await db.query.creditRedeemCodes.findFirst({
      where: eq(creditRedeemCodes.id, id),
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

    if (!code) {
      return NextResponse.json({ error: '兑换码不存在' }, { status: 404 })
    }

    return NextResponse.json(code)
  } catch (error) {
    console.error('Error fetching credit redeem code:', error)
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
  const permissionCheck = await requirePermission('credits-redeem.update')(request)
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

    const updateData: any = {
      ...validation.data,
      updatedAt: new Date(),
    }

    // 如果修改了 code，需要检查是否重复
    if (validation.data.code) {
      const upperCode = validation.data.code.trim().toUpperCase()
      
      // 检查是否有其他兑换码使用了这个 code
      const [existing] = await db
        .select()
        .from(creditRedeemCodes)
        .where(
          and(
            eq(creditRedeemCodes.code, upperCode),
            sql`${creditRedeemCodes.id} != ${id}`
          )
        )
        .limit(1)

      if (existing) {
        return NextResponse.json(
          { error: '兑换码已被其他记录使用' },
          { status: 400 }
        )
      }

      updateData.code = upperCode
    }

    if (validation.data.expiresAt !== undefined) {
      updateData.expiresAt = validation.data.expiresAt ? new Date(validation.data.expiresAt) : null
    }

    const [updatedCode] = await db
      .update(creditRedeemCodes)
      .set(updateData)
      .where(eq(creditRedeemCodes.id, id))
      .returning()

    if (!updatedCode) {
      return NextResponse.json({ error: '兑换码不存在' }, { status: 404 })
    }

    return NextResponse.json(updatedCode)
  } catch (error) {
    console.error('Failed to update credit redeem code:', error)
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
  const permissionCheck = await requirePermission('credits-redeem.delete')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const id = parseInt(params.id)

  try {
    // 检查兑换码是否已被使用
    const [code] = await db
      .select()
      .from(creditRedeemCodes)
      .where(eq(creditRedeemCodes.id, id))
      .limit(1)

    if (!code) {
      return NextResponse.json({ error: '兑换码不存在' }, { status: 404 })
    }

    if (code.usedCount > 0) {
      return NextResponse.json(
        { error: '已使用的兑换码不能删除' },
        { status: 400 }
      )
    }

    await db.delete(creditRedeemCodes).where(eq(creditRedeemCodes.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete credit redeem code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
