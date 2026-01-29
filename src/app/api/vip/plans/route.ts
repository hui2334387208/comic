import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { vipPlans } from '@/db/schema/vip'

export async function GET() {
  try {
    const activePlans = await db.query.vipPlans.findMany({
      where: eq(vipPlans.status, true),
      orderBy: (plans, { asc }) => [asc(plans.sortOrder)],
    })

    return NextResponse.json(activePlans)
  } catch (error) {
    console.error('Failed to fetch active VIP plans:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
