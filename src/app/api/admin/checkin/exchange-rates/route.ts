import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { pointExchangeRates } from '@/db/schema/credits'
import { requirePermission } from '@/lib/permission-middleware'

// GET - 获取兑换比例列表
export async function GET(request: NextRequest) {
  const permissionCheck = await requirePermission('exchange-rate.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const rates = await db.select().from(pointExchangeRates).orderBy(pointExchangeRates.sortOrder)

    return NextResponse.json({ success: true, data: rates })
  } catch (error) {
    console.error('获取兑换比例失败:', error)
    return NextResponse.json({ success: false, error: '获取兑换比例失败' }, { status: 500 })
  }
}

// POST - 创建兑换比例
export async function POST(request: NextRequest) {
  const permissionCheck = await requirePermission('exchange-rate.create')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const body = await request.json()
    const { name, pointsRequired, creditsReceived, description, status, sortOrder } = body

    if (!name || !pointsRequired || !creditsReceived) {
      return NextResponse.json({ success: false, error: '缺少必填字段' }, { status: 400 })
    }

    const [newRate] = await db.insert(pointExchangeRates).values({
      name,
      pointsRequired,
      creditsReceived,
      description: description || null,
      status: status || 'active',
      sortOrder: sortOrder || 0,
    }).returning()

    return NextResponse.json({ success: true, data: newRate })
  } catch (error) {
    console.error('创建兑换比例失败:', error)
    return NextResponse.json({ success: false, error: '创建兑换比例失败' }, { status: 500 })
  }
}
