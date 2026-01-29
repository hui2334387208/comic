import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { feedback } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: number }> },
) {
  // 权限检查
  const permissionCheck = await requirePermission('feedback.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const { id } = await context.params
  try {
    if (isNaN(id)) {
      return NextResponse.json({ error: '无效的ID' }, { status: 400 })
    }

    const result = await db
      .select()
      .from(feedback)
      .where(eq(feedback.id, id))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json({ error: '留言不存在' }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    return NextResponse.json({ error: '获取留言详情失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: number }> },
) {
  // 权限检查
  const permissionCheck = await requirePermission('feedback.delete')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const { id } = await context.params
  try {
    if (isNaN(id)) {
      return NextResponse.json({ error: '无效的ID' }, { status: 400 })
    }

    const result = await db
      .delete(feedback)
      .where(eq(feedback.id, id))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: '留言不存在' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除留言失败' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: number }> },
) {
  // 权限检查
  const permissionCheck = await requirePermission('feedback.update')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const { id } = await context.params
  try {
    if (isNaN(id)) {
      return NextResponse.json({ error: '无效的ID' }, { status: 400 })
    }

    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: '状态不能为空' }, { status: 400 })
    }

    const result = await db
      .update(feedback)
      .set({ status, updatedAt: new Date() })
      .where(eq(feedback.id, id))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: '留言不存在' }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    return NextResponse.json({ error: '更新留言失败' }, { status: 500 })
  }
}
