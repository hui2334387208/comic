import { sql, ilike, or, eq, count } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { vipOrders } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'


export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  // 权限检查
  const permissionCheck = await requirePermission('order.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const searchQuery = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)

  // Build the dynamic where clause
  const whereConditions = []
  if (status) {
    whereConditions.push(eq(vipOrders.status, status))
  }
  if (searchQuery) {
    whereConditions.push(
      or(
        ilike(vipOrders.orderNo, `%${searchQuery}%`),
        ilike(sql`("user"->>'email')::text`, `%${searchQuery}%`),
      ),
    )
  }

  const finalWhere = whereConditions.length > 0 ? sql.join(whereConditions, sql.raw(' and ')) : undefined

  try {
    // Fetch total count and data in parallel
    const [totalResult, orders] = await Promise.all([
      db.select({ total: count() }).from(vipOrders).where(finalWhere),
      db.query.vipOrders.findMany({
        where: finalWhere,
        with: {
          user: { columns: { email: true, name: true } },
          plan: { columns: { name: true } },
          reviewer: {
            columns: {
              name: true,
            },
          },
        },
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
    ])

    const {total} = totalResult[0]

    return NextResponse.json({
      data: orders,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('Failed to fetch VIP orders for admin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
