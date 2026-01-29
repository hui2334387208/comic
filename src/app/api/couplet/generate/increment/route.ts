import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { and, eq, sql } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { generationRateLimits } from '@/db/schema'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    const identifier = userId || ip
    if (!identifier) {
      return new Response(JSON.stringify({ error: '无法验证您的请求身份，请稍后再试。' }), { status: 400 })
    }

    const today = new Date().toISOString().slice(0, 10)

    // Upsert-like behavior using transaction
    await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: generationRateLimits.id, count: generationRateLimits.count })
        .from(generationRateLimits)
        .where(and(
          eq(generationRateLimits.identifier, identifier),
          eq(generationRateLimits.day, today as unknown as any)
        ))
        .limit(1)

      if (existing.length > 0) {
        await tx
          .update(generationRateLimits)
          .set({ count: existing[0].count + 1 })
          .where(eq(generationRateLimits.id, existing[0].id))
      } else {
        await tx.insert(generationRateLimits).values({ 
          identifier, 
          day: today as unknown as any, 
          count: 1 
        })
      }
    })

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: '计数更新失败', detail: error?.message }), { status: 500 })
  }
}

