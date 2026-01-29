import { ilike, or } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { users } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'


export async function GET(request: NextRequest) {
  // 权限检查
  const permissionCheck = await requirePermission('user.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')

  if (!query) {
    return NextResponse.json([]) // Return empty array if no query
  }

  try {
    const userResults = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(
        or(
          ilike(users.email, `%${query}%`),
          ilike(users.name, `%${query}%`),
        ),
      )
      .limit(10) // Limit results for performance

    return NextResponse.json(userResults)
  } catch (error) {
    console.error('Failed to search users for admin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
