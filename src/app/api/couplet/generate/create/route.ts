import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { or, eq } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { couplets, coupletCategories, coupletVersions, coupletTags, coupletTagRelations } from '@/db/schema'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    const body = await request.json()
    const { prompt, description: incomingDescription, classification: incomingClassification, language } = body || {}

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: '请提供有效的prompt参数' }), { status: 400 })
    }

    // 严格使用前端传入；缺失时使用固定默认（不调用AI）
    const description = typeof incomingDescription === 'string' ? incomingDescription : (prompt || '')
    const provided = (incomingClassification && (incomingClassification.data || incomingClassification)) || null

    const categoryInput = provided?.category || { name: 'AI生成', slug: 'ai-generated', description: '由AI智能生成的对联', icon: '🤖', color: '#6366f1' }
    const tagsInput = Array.isArray(provided?.tags) ? provided.tags : []

    let categoryId = 0
    let coupletId = 0
    const createdTags: { id: number; name: string; slug: string }[] = []

    await db.transaction(async (tx) => {
      // 确保分类存在
      const found = await tx
        .select()
        .from(coupletCategories)
        .where(or(eq(coupletCategories.slug, categoryInput.slug), eq(coupletCategories.name, categoryInput.name)))
        .limit(1)
      if (found.length > 0) {
        categoryId = found[0].id
      } else {
        const [newCategory] = await tx
          .insert(coupletCategories)
          .values({
            name: categoryInput.name,
            slug: categoryInput.slug,
            description: categoryInput.description || `${categoryInput.name}相关对联`,
            icon: categoryInput.icon,
            color: categoryInput.color,
          })
          .returning()
        categoryId = newCategory.id
      }

      // 创建对联
      const [newCouplet] = await tx
        .insert(couplets)
        .values({
          title: prompt,
          slug: `ai-generated-${Date.now()}`,
          description,
          categoryId,
          authorId: userId || null,
          status: 'published',
          isPublic: true,
          model: process.env.DEEPSEEK_MODEL as string,
          prompt,
          language
        })
        .returning()
      coupletId = newCouplet.id

      // 创建初始版本
      await tx.insert(coupletVersions).values({
        coupletId,
        version: 1,
        parentVersionId: null,
        versionDescription: '初始化',
        isLatestVersion: true,
        originalCoupletId: coupletId,
      })

      // 处理标签关系
      for (const tag of tagsInput) {
        const existedTag = await tx
          .select()
          .from(coupletTags)
          .where(or(eq(coupletTags.slug, tag.slug), eq(coupletTags.name, tag.name)))
          .limit(1)
        let tagId: number
        if (existedTag.length > 0) {
          tagId = existedTag[0].id
        } else {
          const [newTag] = await tx
            .insert(coupletTags)
            .values({ name: tag.name, slug: tag.slug, color: tag.color })
            .returning()
          tagId = newTag.id
        }
        createdTags.push({ id: tagId, name: tag.name, slug: tag.slug })
        await tx.insert(coupletTagRelations).values({ coupletId, tagId })
      }
    })

    const [cat] = await db
      .select({ id: coupletCategories.id, name: coupletCategories.name, slug: coupletCategories.slug, icon: coupletCategories.icon, color: coupletCategories.color })
      .from(coupletCategories)
      .where(eq(coupletCategories.id, categoryId))
      .limit(1)

    return new Response(
      JSON.stringify({ success: true, data: { id: Number(coupletId), title: prompt, description, category: cat, tags: createdTags } }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: '创建对联失败', detail: error?.message }), { status: 500 })
  }
}

