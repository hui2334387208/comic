import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { or, eq } from 'drizzle-orm'

import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { comics, comicCategories, comicVersions, comicTags, comicTagRelations, comicVolumes, comicEpisodes, comicPanels } from '@/db/schema'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    const body = await request.json()
    const { prompt, title, description, category, tags, language, style, volumes } = body || {}

    if (!prompt) {
      return NextResponse.json({ error: '请提供有效的prompt参数' }, { status: 400 })
    }

    const comicTitle = title
    const comicDescription = description

    const categoryInput = category || { name: 'AI生成', slug: 'ai-generated', description: '由AI智能生成的漫画', icon: '🎨', color: '#8b5cf6' }
    const tagsInput = tags || []

    let categoryId = 0
    let comicId = 0
    const createdTags: { id: number; name: string; slug: string }[] = []

    await db.transaction(async (tx) => {
      // 确保分类存在
      const found = await tx
        .select()
        .from(comicCategories)
        .where(or(eq(comicCategories.slug, categoryInput.slug), eq(comicCategories.name, categoryInput.name)))
        .limit(1)
      if (found.length > 0) {
        categoryId = found[0].id
      } else {
        const [newCategory] = await tx
          .insert(comicCategories)
          .values({
            name: categoryInput.name,
            slug: categoryInput.slug,
            description: categoryInput.description || `${categoryInput.name}相关漫画`,
            icon: categoryInput.icon,
            color: categoryInput.color,
          })
          .returning()
        categoryId = newCategory.id
      }

      // 计算总话数
      let totalEpisodes = 0
      if (volumes && Array.isArray(volumes)) {
        for (const volume of volumes) {
          if (volume.episodes && Array.isArray(volume.episodes)) {
            totalEpisodes += volume.episodes.length
          }
        }
      }

      // 创建漫画
      const [newComic] = await tx
        .insert(comics)
        .values({
          title: comicTitle,
          slug: `ai-generated-${Date.now()}`,
          description: comicDescription,
          categoryId,
          authorId: userId || null,
          status: 'published',
          isPublic: true,
          model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
          prompt,
          language: language || 'zh',
          style: style || 'anime',
          episodeCount: totalEpisodes, // 根据volumes计算的总话数
          volumeCount: volumes?.length || 0, // 卷数
          viewCount: 0,
          likeCount: 0,
          hot: 0,
          isFeatured: false
        })
        .returning()
      comicId = newComic.id

      // 创建初始版本
      const [newVersion] = await tx.insert(comicVersions).values({
        comicId,
        version: 1,
        parentVersionId: null,
        versionDescription: '初始化',
        isLatestVersion: true,
      }).returning()

      const versionId = newVersion.id

      // 保存volumes结构到数据库
      if (volumes && Array.isArray(volumes)) {
        let totalEpisodes = 0

        for (let volumeIndex = 0; volumeIndex < volumes.length; volumeIndex++) {
          const volume = volumes[volumeIndex]
          const volumeEpisodeCount = volume.episodes?.length || 0
          
          // 计算这一卷的起始和结束话数
          const startEpisode = volumeEpisodeCount > 0 ? totalEpisodes + 1 : null
          const endEpisode = volumeEpisodeCount > 0 ? totalEpisodes + volumeEpisodeCount : null
          
          // 创建卷记录
          const [newVolume] = await tx
            .insert(comicVolumes)
            .values({
              comicId,
              versionId,
              volumeNumber: volumeIndex + 1,
              title: volume.title || `第${volumeIndex + 1}卷`,
              description: volume.description || '',
              episodeCount: volumeEpisodeCount,
              startEpisode,
              endEpisode
            })
            .returning()

          const volumeId = newVolume.id

          // 保存卷中的每一话
          if (volume.episodes && Array.isArray(volume.episodes)) {
            for (let episodeIndex = 0; episodeIndex < volume.episodes.length; episodeIndex++) {
              const episode = volume.episodes[episodeIndex]
              totalEpisodes++

              // 创建话记录
              const [newEpisode] = await tx
                .insert(comicEpisodes)
                .values({
                  comicId,
                  versionId,
                  volumeId,
                  episodeNumber: totalEpisodes,
                  title: episode.title || `第${totalEpisodes}话`,
                  description: episode.description || '',
                  imageCount: episode.panels?.length || 0
                })
                .returning()

              const episodeId = newEpisode.id

              // 保存话中的每个分镜（不含图片URL）
              if (episode.panels && Array.isArray(episode.panels)) {
                for (let panelIndex = 0; panelIndex < episode.panels.length; panelIndex++) {
                  const panel = episode.panels[panelIndex]

                  await tx.insert(comicPanels).values({
                    episodeId,
                    imageNumber: panelIndex + 1,
                    imageUrl: '', // 图片URL稍后更新
                    sceneDescription: panel.sceneDescription || '',
                    dialogue: panel.dialogue || '',
                    narration: panel.narration || '',
                    emotion: panel.emotion || '平静',
                    cameraAngle: panel.cameraAngle || '正面视角',
                    characters: panel.characters || '',
                    generationStatus: 'pending'
                  })
                }
              }
            }
          }
        }
      }

      // 处理标签关系
      for (const tag of tagsInput) {
        if (!tag?.name || !tag?.slug) continue
        
        const existedTag = await tx
          .select()
          .from(comicTags)
          .where(or(eq(comicTags.slug, tag.slug), eq(comicTags.name, tag.name)))
          .limit(1)
        let tagId
        if (existedTag.length > 0) {
          tagId = existedTag[0].id
        } else {
          const [newTag] = await tx
            .insert(comicTags)
            .values({ 
              name: tag.name, 
              slug: tag.slug, 
              color: tag.color || '#8b5cf6' 
            })
            .returning()
          tagId = newTag.id
        }
        createdTags.push({ id: tagId, name: tag.name, slug: tag.slug })
        await tx.insert(comicTagRelations).values({ comicId, tagId })
      }
    })

    const [cat] = await db
      .select({ 
        id: comicCategories.id, 
        name: comicCategories.name, 
        slug: comicCategories.slug, 
        icon: comicCategories.icon, 
        color: comicCategories.color 
      })
      .from(comicCategories)
      .where(eq(comicCategories.id, categoryId))
      .limit(1)

    return NextResponse.json({ 
      success: true, 
      data: { 
        id: comicId, 
        title: comicTitle, 
        description: comicDescription, 
        category: cat, 
        tags: createdTags 
      } 
    })
  } catch (error: any) {
    console.error('创建漫画失败:', error)
    return NextResponse.json({ error: '创建漫画失败', detail: error?.message }, { status: 500 })
  }
}