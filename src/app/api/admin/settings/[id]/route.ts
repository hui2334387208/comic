import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { settings } from '@/db/schema'
import { logger } from '@/lib/logger'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: number }> },
) {
  // 权限检查
  const permissionCheck = await requirePermission('site-settings.update')(request)
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
      await logger.warning({
        module: 'admin',
        action: 'update_setting',
        description: '更新配置失败：无效的ID',
      })
      return NextResponse.json({ error: '无效的ID' }, { status: 400 })
    }
    const body = await request.json()
    const { key, value, description } = body
    if (!key || !value) {
      await logger.warning({
        module: 'admin',
        action: 'update_setting',
        description: '更新配置失败：配置键名和值不能为空',
      })
      return NextResponse.json({ error: '配置键名和值不能为空' }, { status: 400 })
    }
    const result = await db
      .update(settings)
      .set({ key, value, description, updatedAt: new Date() })
      .where(eq(settings.id, id))
      .returning()
    if (result.length === 0) {
      await logger.warning({
        module: 'admin',
        action: 'update_setting',
        description: `更新配置失败：配置不存在 (${id})`,
      })
      return NextResponse.json({ error: '配置不存在' }, { status: 404 })
    }
    await logger.info({
      module: 'admin',
      action: 'update_setting',
      description: `更新配置成功：${key}`,
    })
    return NextResponse.json(result[0])
  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'update_setting',
      description: `更新配置失败：${error instanceof Error ? error.message : '未知错误'}`,
    })
    return NextResponse.json({ error: '更新配置失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: number }> },
) {
  // 权限检查
  const permissionCheck = await requirePermission('site-settings.delete')(request)
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
      await logger.warning({
        module: 'admin',
        action: 'delete_setting',
        description: '删除配置失败：无效的ID',
      })
      return NextResponse.json({ error: '无效的ID' }, { status: 400 })
    }
    const result = await db
      .delete(settings)
      .where(eq(settings.id, id))
      .returning()
    if (result.length === 0) {
      await logger.warning({
        module: 'admin',
        action: 'delete_setting',
        description: `删除配置失败：配置不存在 (${id})`,
      })
      return NextResponse.json({ error: '配置不存在' }, { status: 404 })
    }
    await logger.info({
      module: 'admin',
      action: 'delete_setting',
      description: `删除配置成功：ID ${id}`,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'delete_setting',
      description: `删除配置失败：${error instanceof Error ? error.message : '未知错误'}`,
    })
    return NextResponse.json({ error: '删除配置失败' }, { status: 500 })
  }
}
