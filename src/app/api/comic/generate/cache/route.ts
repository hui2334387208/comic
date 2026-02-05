import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { and, eq, sql } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { comics, comicCategories, comicTagRelations, comicTags } from '@/db/schema'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    const body = await request.json()
    const { prompt, force = false, language } = body || {}

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: '请提供有效的prompt参数' }, { status: 400 })
    }

    const comicWhere = [eq(comics.title, prompt), eq(comics.language, language)] as any[]
    if (userId) {
      comicWhere.push(eq(comics.authorId, userId))
    } else {
      comicWhere.push(sql`${comics.authorId} IS NULL`)
    }

    const existingComic = await db
      .select({
        id: comics.id,
        title: comics.title,
        description: comics.description,
        categoryId: comics.categoryId,
        createdAt: comics.createdAt,
      })
      .from(comics)
      .where(and(...comicWhere))
      .limit(1)

    if (force || existingComic.length === 0) {
      return NextResponse.json({ success: false, error: '未命中缓存' })
    }

    let category: any = null
    if (existingComic[0].categoryId) {
      const categoryResult = await db
        .select({
          id: comicCategories.id,
          name: comicCategories.name,
          slug: comicCategories.slug,
          icon: comicCategories.icon,
          color: comicCategories.color,
        })
        .from(comicCategories)
        .where(eq(comicCategories.id, existingComic[0].categoryId))
        .limit(1)
      category = categoryResult[0] || null
    }

    const tags = await db
      .select({ id: comicTags.id, name: comicTags.name, slug: comicTags.slug })
      .from(comicTagRelations)
      .leftJoin(comicTags, eq(comicTagRelations.tagId, comicTags.id))
      .where(eq(comicTagRelations.comicId, existingComic[0].id))

    return NextResponse.json({
      success: true,
      data: {
        id: Number(existingComic[0].id),
        title: existingComic[0].title,
        description: existingComic[0].description,
        category,
        tags: tags.map(t => ({ id: t.id, name: t.name, slug: t.slug })),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: '缓存查询失败', detail: error?.message }, { status: 500 })
  }
}