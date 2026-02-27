import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { checkInRules } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requirePermission } from '@/lib/permission-middleware'

/**
 * GET /api/admin/checkin/rules/[id] - 获取签到规则详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionCheck = await requirePermission('checkin-rule.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { id } = await params
    const [rule] = await db
      .select()
      .from(checkInRules)
      .where(eq(checkInRules.id, parseInt(id)))
      .limit(1)

    if (!rule) {
      return NextResponse.json(
        {
          success: false,
          error: '签到规则不存在',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: rule,
    })
  } catch (error: any) {
    console.error('获取签到规则详情失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取签到规则详情失败',
        detail: error?.message,
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/checkin/rules/[id] - 更新签到规则
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionCheck = await requirePermission('checkin-rule.update')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { name, consecutiveDays, points, description, status, sortOrder } = body

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
      .update(checkInRules)
      .set({
        name,
        consecutiveDays,
        points,
        description,
        status,
        sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(checkInRules.id, parseInt(id)))
      .returning()

    if (!rule) {
      return NextResponse.json(
        {
          success: false,
          error: '签到规则不存在',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: rule,
      message: '签到规则更新成功',
    })
  } catch (error: any) {
    console.error('更新签到规则失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '更新签到规则失败',
        detail: error?.message,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/checkin/rules/[id] - 删除签到规则
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionCheck = await requirePermission('checkin-rule.delete')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { id } = await params
    await db
      .delete(checkInRules)
      .where(eq(checkInRules.id, parseInt(id)))

    return NextResponse.json({
      success: true,
      message: '签到规则删除成功',
    })
  } catch (error: any) {
    console.error('删除签到规则失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '删除签到规则失败',
        detail: error?.message,
      },
      { status: 500 }
    )
  }
}
