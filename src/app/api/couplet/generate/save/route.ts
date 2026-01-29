import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { and, eq, or, sql } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { couplets, coupletContents, coupletCategories, coupletVersions, coupletTags, coupletTagRelations } from '@/db/schema'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    const body = await request.json()
    const { prompt, contents = [], description = '', classification, force = false, coupletId, language } = body || {}

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: '请提供有效的prompt参数' }), { status: 400 })
    }
    if (!Array.isArray(contents) || contents.length === 0) {
      return new Response(JSON.stringify({ error: '请提供有效的contents数组' }), { status: 400 })
    }

    const coupletWhere = [eq(couplets.title, prompt)] as any[]
    if (userId) {
      coupletWhere.push(eq(couplets.authorId, userId))
    } else {
      coupletWhere.push(sql`${couplets.authorId} IS NULL`)
    }

    // 若传入 coupletId，优先精确定位该对联
    const preferred = coupletId
      ? await db
          .select({ id: couplets.id, title: couplets.title })
          .from(couplets)
          .where(eq(couplets.id, Number(coupletId)))
          .limit(1)
      : []

    const existingCouplet = preferred.length > 0
      ? preferred
      : await db
          .select({ id: couplets.id, title: couplets.title })
          .from(couplets)
          .where(and(...coupletWhere))
          .limit(1)

    let categoryId = 1
    const generatedTags: any[] = []
    let responseData: any = null

    await db.transaction(async (tx) => {
      try {
        if (classification?.data?.category) {
          const cat = classification.data.category
          if (cat.isNew) {
            const [newCategory] = await tx
              .insert(coupletCategories)
              .values({
                name: cat.name,
                slug: cat.slug,
                description: cat.description || `${cat.name}相关对联`,
                icon: cat.icon,
                color: cat.color,
              })
              .returning()
            categoryId = newCategory.id
          } else {
            const existingCategory = await tx
              .select()
              .from(coupletCategories)
              .where(or(eq(coupletCategories.slug, cat.slug), eq(coupletCategories.name, cat.name)))
              .limit(1)
            if (existingCategory.length > 0) {
              categoryId = existingCategory[0].id
            } else {
              const [newCategory] = await tx
                .insert(coupletCategories)
                .values({
                  name: cat.name,
                  slug: cat.slug,
                  description: cat.description || `${cat.name}相关对联`,
                  icon: cat.icon,
                  color: cat.color,
                })
                .returning()
              categoryId = newCategory.id
            }
          }
        }

        if (Array.isArray(classification?.data?.tags)) {
          for (const tagData of classification.data.tags) {
            let tagId: number
            const existingTag = await tx
              .select()
              .from(coupletTags)
              .where(or(eq(coupletTags.slug, tagData.slug), eq(coupletTags.name, tagData.name)))
              .limit(1)
            if (existingTag.length > 0) {
              tagId = existingTag[0].id
            } else {
              const [newTag] = await tx
                .insert(coupletTags)
                .values({ name: tagData.name, slug: tagData.slug, color: tagData.color })
                .returning()
              tagId = newTag.id
            }
            generatedTags.push({ id: tagId, name: tagData.name, slug: tagData.slug })
          }
        }
      } catch (error) {
        const defaultCategory = await tx
          .select()
          .from(coupletCategories)
          .where(eq(coupletCategories.slug, 'ai-generated'))
          .limit(1)
        if (defaultCategory.length > 0) {
          categoryId = defaultCategory[0].id
        } else {
          const [newCategory] = await tx
            .insert(coupletCategories)
            .values({
              name: 'AI生成',
              slug: 'ai-generated',
              description: '由AI智能生成的对联',
              icon: '🤖',
              color: '#6366f1',
            })
            .returning()
          categoryId = newCategory.id
        }
      }

      let couplet: any
      let versionNumber = 1
      let versionId: number

      const shouldCreateOnSpecific = preferred.length > 0
      const shouldAppendVersion = shouldCreateOnSpecific || (!force && existingCouplet.length > 0)

      if (shouldAppendVersion) {
        couplet = shouldCreateOnSpecific ? preferred[0] : existingCouplet[0]
        const lastVersion = await tx
          .select({ version: coupletVersions.version, id: coupletVersions.id })
          .from(coupletVersions)
          .where(and(eq(coupletVersions.coupletId, couplet.id), eq(coupletVersions.isLatestVersion, true)))
        versionNumber = lastVersion.length > 0 ? lastVersion[0].version + 1 : 1
        await tx.update(coupletVersions).set({ isLatestVersion: false }).where(eq(coupletVersions.coupletId, couplet.id))
        const [newVersion] = await tx
          .insert(coupletVersions)
          .values({
            coupletId: couplet.id,
            version: versionNumber,
            parentVersionId: lastVersion[0]?.id ?? null,
            versionDescription: `AI生成版本${versionNumber}`,
            isLatestVersion: true,
            originalCoupletId: couplet.id,
          })
          .returning()
        versionId = newVersion.id
      } else {
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
        couplet = newCouplet
        const [newVersion] = await tx
          .insert(coupletVersions)
          .values({
            coupletId: couplet.id,
            version: 1,
            parentVersionId: null,
            versionDescription: 'AI生成初始版本',
            isLatestVersion: true,
            originalCoupletId: couplet.id,
          })
          .returning()
        versionId = newVersion.id
      }

      const coupletContentData = contents.map((content: any, index: number) => ({
        coupletId: couplet.id,
        versionId,
        upperLine: content.upperLine || '上联',
        lowerLine: content.lowerLine || '下联',
        horizontalScroll: content.horizontalScroll || '横批',
        appreciation: content.appreciation || '',
        orderIndex: index,
      }))
      await tx.insert(coupletContents).values(coupletContentData)

      if (generatedTags.length > 0) {
        const tagRelations = generatedTags.map(tag => ({ coupletId: couplet.id, tagId: tag.id }))
        await tx.insert(coupletTagRelations).values(tagRelations)
      }

      responseData = {
        id: Number(couplet.id),
        title: couplet.title,
        version: Number(versionNumber),
        versionId: Number(versionId),
        contents,
        totalContents: contents.length,
        model: process.env.DEEPSEEK_MODEL as string,
        generatedAt: new Date().toISOString(),
        fromCache: false,
        category: classification?.data?.category
          ? {
              id: categoryId,
              name: classification.data.category.name,
              slug: classification.data.category.slug,
              icon: classification.data.category.icon,
              color: classification.data.category.color,
            }
          : null,
        tags: generatedTags,
      }
    })

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (thrown: any) {
    return new Response(JSON.stringify({ error: '保存失败', detail: thrown?.message }), { status: 500 })
  }
}

