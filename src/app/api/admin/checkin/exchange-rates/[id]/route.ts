import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { pointExchangeRates } from '@/db/schema/credits'
import { eq } from 'drizzle-orm'
import { requirePermission } from '@/lib/permission-middleware'

// GET - 获取单个兑换比例
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const permissionCheck = await requirePermission('exchange-rate.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const [rate] = await db
      .select()
      .from(pointExchangeRates)
      .where(eq(pointExchangeRates.id, parseInt(params.id)))

    if (!rate) {
      return NextResponse.json({ success: false, error: '兑换比例不存在' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: rate })
  } catch (error) {
    console.error('获取兑换比例失败:', error)
    return NextResponse.json({ success: false, error: '获取兑换比例失败' }, { status: 500 })
  }
}

// PUT - 更新兑换比例
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const permissionCheck = await requirePermission('exchange-rate.update')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const body = await request.json()
    const { name, pointsRequired, creditsReceived, description, status, sortOrder } = body

    const [updatedRate] = await db
      .update(pointExchangeRates)
      .set({
        name,
        pointsRequired,
        creditsReceived,
        description,
        status,
        sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(pointExchangeRates.id, parseInt(params.id)))
      .returning()

    if (!updatedRate) {
      return NextResponse.json({ success: false, error: '兑换比例不存在' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updatedRate })
  } catch (error) {
    console.error('更新兑换比例失败:', error)
    return NextResponse.json({ success: false, error: '更新兑换比例失败' }, { status: 500 })
  }
}

// DELETE - 删除兑换比例
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const permissionCheck = await requirePermission('exchange-rate.delete')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const [deletedRate] = await db
      .delete(pointExchangeRates)
      .where(eq(pointExchangeRates.id, parseInt(params.id)))
      .returning()

    if (!deletedRate) {
      return NextResponse.json({ success: false, error: '兑换比例不存在' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('删除兑换比例失败:', error)
    return NextResponse.json({ success: false, error: '删除兑换比例失败' }, { status: 500 })
  }
}
