import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { checkInRules } from '@/db/schema'
import { requirePermission } from '@/lib/permission-middleware'

/**
 * GET /api/admin/checkin/rules - 获取签到规则列表
 */
export async function GET(request: NextRequest) {
  const permissionCheck = await requirePermission('checkin-rule.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const rules = await db
      .select()
      .from(checkInRules)
      .orderBy(checkInRules.sortOrder, checkInRules.consecutiveDays)

    return NextResponse.json({
      success: true,
      data: rules,
    })
  } catch (error: any) {
    console.error('获取签到规则失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取签到规则失败',
        detail: error?.message,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/checkin/rules - 创建签到规则
 */
export async function POST(request: NextRequest) {
  const permissionCheck = await requirePermission('checkin-rule.create')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const body = await request.json()
    const { name, consecutiveDays, points, description, status = 'active', sortOrder = 0 } = body

    if (!name || !consecutiveDays || !points) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必填字段',
        },
        { status: 400 }
      )
    }

    const [rule] = await db
      .insert(checkInRules)
      .values({
        name,
        consecutiveDays,
        points,
        description,
        status,
        sortOrder,
      })
      .returning()

    return NextResponse.json({
      success: true,
      data: rule,
      message: '签到规则创建成功',
    })
  } catch (error: any) {
    console.error('创建签到规则失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '创建签到规则失败',
        detail: error?.message,
      },
      { status: 500 }
    )
  }
}
