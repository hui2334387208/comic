import { eq, and, gte, lte, like, desc, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { systemLogs } from '@/db/schema/system_logs'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    // 权限检查
    const permissionCheck = await requirePermission('system.read')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const level = searchParams.get('level')
    const module = searchParams.get('module')
    const search = searchParams.get('search')
    const language = searchParams.get('language')

    const conditions = []

    if (startDate && endDate) {
      conditions.push(
        gte(systemLogs.createdAt, new Date(startDate)),
        lte(systemLogs.createdAt, new Date(endDate)),
      )
    }

    if (level) {
      conditions.push(eq(systemLogs.level, level))
    }

    if (module) {
      conditions.push(eq(systemLogs.module, module))
    }

    if (search) {
      conditions.push(like(systemLogs.description, `%${search}%`))
    }

    if (language) {
      conditions.push(eq(systemLogs.language, language))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [total, items] = await Promise.all([
      db.select({ count: sql<number>`count(*)` })
        .from(systemLogs)
        .where(whereClause)
        .then(result => Number(result[0].count)),
      db.select()
        .from(systemLogs)
        .where(whereClause)
        .orderBy(desc(systemLogs.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ])

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('获取系统日志失败:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    // 权限检查
    const permissionCheck = await requirePermission('system.read')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip')
    const userAgent = headersList.get('user-agent')
    const language = headersList.get('accept-language')?.split(',')[0] || 'en'

    await db.insert(systemLogs).values({
      level: body.level,
      module: body.module,
      action: body.action,
      description: body.description,
      ip: ip || undefined,
      userAgent: userAgent || undefined,
      userId: body.userId,
      language,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to create log:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
