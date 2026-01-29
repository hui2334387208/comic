import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { and, eq, sql } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { couplets, coupletCategories, coupletTagRelations, coupletTags } from '@/db/schema'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    const body = await request.json()
    const { prompt, force = false, language } = body || {}

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: '请提供有效的prompt参数' }), { status: 400 })
    }

    const coupletWhere = [eq(couplets.title, prompt), eq(couplets.language, language)] as any[]
    if (userId) {
      coupletWhere.push(eq(couplets.authorId, userId))
    } else {
      coupletWhere.push(sql`${couplets.authorId} IS NULL`)
    }

    const existingCouplet = await db
      .select({
        id: couplets.id,
        title: couplets.title,
        description: couplets.description,
        categoryId: couplets.categoryId,
        createdAt: couplets.createdAt,
      })
      .from(couplets)
      .where(and(...coupletWhere))
      .limit(1)

    if (force || existingCouplet.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: '未命中缓存' }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 },
      )
    }

    let category: any = null
    if (existingCouplet[0].categoryId) {
      const categoryResult = await db
        .select({
          id: coupletCategories.id,
          name: coupletCategories.name,
          slug: coupletCategories.slug,
          icon: coupletCategories.icon,
          color: coupletCategories.color,
        })
        .from(coupletCategories)
        .where(eq(coupletCategories.id, existingCouplet[0].categoryId))
        .limit(1)
      category = categoryResult[0] || null
    }

    const tags = await db
      .select({ id: coupletTags.id, name: coupletTags.name, slug: coupletTags.slug })
      .from(coupletTagRelations)
      .leftJoin(coupletTags, eq(coupletTagRelations.tagId, coupletTags.id))
      .where(eq(coupletTagRelations.coupletId, existingCouplet[0].id))

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: Number(existingCouplet[0].id),
          title: existingCouplet[0].title,
          description: existingCouplet[0].description,
          category,
          tags: tags.map(t => ({ id: t.id, name: t.name, slug: t.slug })),
        },
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: '缓存查询失败', detail: error?.message }), { status: 500 })
  }
}

