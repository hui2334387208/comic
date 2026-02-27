import { NextResponse } from 'next/server'
import { db } from '@/db'
import { pointExchangeRates } from '@/db/schema/credits'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const rates = await db
      .select()
      .from(pointExchangeRates)
      .where(eq(pointExchangeRates.status, 'active'))
      .orderBy(pointExchangeRates.sortOrder)

    return NextResponse.json({
      success: true,
      data: rates,
    })
  } catch (error) {
    console.error('获取兑换比例失败:', error)
    return NextResponse.json(
      { success: false, error: '获取兑换比例失败' },
      { status: 500 }
    )
  }
}
