import { NextResponse } from 'next/server'
import { db } from '@/db'
import { checkInRules } from '@/db/schema/credits'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const rules = await db
      .select()
      .from(checkInRules)
      .where(eq(checkInRules.status, 'active'))
      .orderBy(checkInRules.sortOrder)

    return NextResponse.json({
      success: true,
      data: rules,
    })
  } catch (error) {
    console.error('获取签到规则失败:', error)
    return NextResponse.json(
      { success: false, error: '获取签到规则失败' },
      { status: 500 }
    )
  }
}
