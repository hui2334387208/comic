import { like, and } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { settings } from '@/db/schema'
import { logger } from '@/lib/logger'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(request: NextRequest) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('site-settings.read')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const keyPrefix = searchParams.get('keyPrefix')

    const conditions = []

    if (search) {
      conditions.push(
        like(settings.key, `%${search}%`),
      )
    }

    if (keyPrefix) {
      conditions.push(
        like(settings.key, `${keyPrefix}%`),
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const result = await db
      .select()
      .from(settings)
      .where(whereClause)
      .orderBy(settings.createdAt)

    return NextResponse.json(result)
  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'list_settings',
      description: `获取配置列表失败：${error instanceof Error ? error.message : '未知错误'}`,
    })
    return NextResponse.json({ error: '获取配置失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('site-settings.create')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const { key, value, description } = body
    if (!key || !value) {
      await logger.warning({
        module: 'admin',
        action: 'create_setting',
        description: '添加配置失败：配置键名和值不能为空',
      })
      return NextResponse.json({ error: '配置键名和值不能为空' }, { status: 400 })
    }
    const result = await db
      .insert(settings)
      .values({ key, value, description })
      .returning()
    await logger.info({
      module: 'admin',
      action: 'create_setting',
      description: `添加配置成功：${key}`,
    })
    return NextResponse.json(result[0])
  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'create_setting',
      description: `添加配置失败：${error instanceof Error ? error.message : '未知错误'}`,
    })
    return NextResponse.json({ error: '添加配置失败' }, { status: 500 })
  }
}
