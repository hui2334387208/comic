import { and, eq, or, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { coupletViews } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: number }> },
) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id || null
  const { id: coupletId } = await context.params
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
  if (!coupletId) {
    return NextResponse.json({ success: false, message: '无效的对联ID' }, { status: 400 })
  }
  try {
    const today = new Date().toISOString().slice(0, 10)
    const where = [eq(coupletViews.coupletId, coupletId)]
    if (userId) {
      where.push(eq(coupletViews.userId, userId))
    } else {
      where.push(eq(coupletViews.ip, ip))
    }
    where.push(sql`DATE(${coupletViews.createdAt}) = ${today}`)
    const exist = await db.select().from(coupletViews).where(and(...where))
    if (!exist.length) {
      await db.insert(coupletViews).values({ coupletId, userId, ip })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, message: '写入浏览明细失败' }, { status: 500 })
  }
}

