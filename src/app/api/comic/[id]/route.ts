import { eq, and, desc } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/db'
import { 
  comics, 
  comicCategories, 
  comicVersions, 
  comicVolumes, 
  comicEpisodes, 
  comicPages, 
  comicPanels,
  comicTagRelations,
  comicTags
} from '@/db/schema/comic'
import { users } from '@/db/schema/users'
import { publicApiRateLimit } from '@/lib/rate-limit'

// GET /api/comic/[id] - 获取漫画详情
export async function GET(
  request: NextRequest,
  context: { params: Promise<any> },
) {
  try {
    const rateLimit = publicApiRateLimit(request)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: '请求过于频繁，请稍后再试' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter ?? Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
          },
        },
      )
    }

    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const versionId = searchParams.get('versionId')

    const comicId = parseInt(id)
    if (isNaN(comicId)) {
      return NextResponse.json(
        { success: false, message: '无效的漫画ID' },
        { status: 400 },
      )
    }

    // 确定要查询的版本ID
    let targetVersionId: number

    if (versionId) {
      targetVersionId = parseInt(versionId)
    } else {
      // 查询最新版本
      const latestVersion = await db
        .select({ id: comicVersions.id })
        .from(comicVersions)
        .where(and(eq(comicVersions.comicId, comicId), eq(comicVersions.isLatestVersion, true)))
        .limit(1)

      if (latestVersion.length === 0) {
        return NextResponse.json(
          { success: false, message: '漫画版本不存在' },
          { status: 404 },
        )
      }

      targetVersionId = latestVersion[0].id
    }

    // 获取漫画基本信息
    const comicData = await db
      .select({
        id: comics.id,
        title: comics.title,
        slug: comics.slug,
        description: comics.description,
        categoryId: comics.categoryId,
        authorId: comics.authorId,
        status: comics.status,
        isPublic: comics.isPublic,
        viewCount: comics.viewCount,
        likeCount: comics.likeCount,
        model: comics.model,
        prompt: comics.prompt,
        coverImage: comics.coverImage,
        volumeCount: comics.volumeCount,
        episodeCount: comics.episodeCount,
        style: comics.style,
        createdAt: comics.createdAt,
        updatedAt: comics.updatedAt,
        category: {
          id: comicCategories.id,
          name: comicCategories.name,
          slug: comicCategories.slug,
          icon: comicCategories.icon,
          color: comicCategories.color,
        },
        author: {
          id: users.id,
          name: users.name,
          username: users.username,
          avatar: users.avatar,
        },
      })
      .from(comics)
      .leftJoin(comicCategories, eq(comics.categoryId, comicCategories.id))
      .leftJoin(users, eq(comics.authorId, users.id))
      .where(eq(comics.id, comicId))
      .limit(1)

    if (comicData.length === 0) {
      return NextResponse.json(
        { success: false, message: '漫画不存在' },
        { status: 404 },
      )
    }

    const comic = comicData[0]

    // 获取漫画标签
    const tagRelationsRaw = await db.select({
      tagId: comicTags.id,
      name: comicTags.name,
      slug: comicTags.slug,
    })
      .from(comicTagRelations)
      .leftJoin(comicTags, eq(comicTagRelations.tagId, comicTags.id))
      .where(eq(comicTagRelations.comicId, comicId))

    // 标签去重
    const tagSet = new Set()
    const tagRelations = []
    for (const tr of tagRelationsRaw) {
      if (tr.tagId && !tagSet.has(tr.tagId)) {
        tagSet.add(tr.tagId)
        tagRelations.push(tr)
      }
    }

    // 获取卷信息
    const volumes = await db
      .select({
        id: comicVolumes.id,
        volumeNumber: comicVolumes.volumeNumber,
        title: comicVolumes.title,
        description: comicVolumes.description,
        coverImage: comicVolumes.coverImage,
        episodeCount: comicVolumes.episodeCount,
        startEpisode: comicVolumes.startEpisode,
        endEpisode: comicVolumes.endEpisode,
        status: comicVolumes.status,
        createdAt: comicVolumes.createdAt,
      })
      .from(comicVolumes)
      .where(and(eq(comicVolumes.comicId, comicId), eq(comicVolumes.versionId, targetVersionId)))
      .orderBy(comicVolumes.volumeNumber)

    // 获取每卷的话
    const volumesWithEpisodes = await Promise.all(
      volumes.map(async (volume) => {
        const episodes = await db
          .select({
            id: comicEpisodes.id,
            episodeNumber: comicEpisodes.episodeNumber,
            title: comicEpisodes.title,
            description: comicEpisodes.description,
            pageCount: comicEpisodes.pageCount,
            status: comicEpisodes.status,
            createdAt: comicEpisodes.createdAt,
          })
          .from(comicEpisodes)
          .where(and(
            eq(comicEpisodes.comicId, comicId),
            eq(comicEpisodes.versionId, targetVersionId),
            eq(comicEpisodes.volumeId, volume.id)
          ))
          .orderBy(comicEpisodes.episodeNumber)

        // 获取每话的页和分镜
        const episodesWithPages = await Promise.all(
          episodes.map(async (episode) => {
            const pages = await db
              .select({
                id: comicPages.id,
                pageNumber: comicPages.pageNumber,
                pageLayout: comicPages.pageLayout,
                panelCount: comicPages.panelCount,
                imageUrl: comicPages.imageUrl,
                status: comicPages.status,
              })
              .from(comicPages)
              .where(eq(comicPages.episodeId, episode.id))
              .orderBy(comicPages.pageNumber)

            // 获取每页的分镜
            const pagesWithPanels = await Promise.all(
              pages.map(async (page) => {
                const panels = await db
                  .select({
                    id: comicPanels.id,
                    panelNumber: comicPanels.panelNumber,
                    sceneDescription: comicPanels.sceneDescription,
                    dialogue: comicPanels.dialogue,
                    narration: comicPanels.narration,
                    emotion: comicPanels.emotion,
                    cameraAngle: comicPanels.cameraAngle,
                    characters: comicPanels.characters,
                  })
                  .from(comicPanels)
                  .where(eq(comicPanels.pageId, page.id))
                  .orderBy(comicPanels.panelNumber)

                return {
                  id: page.id,
                  pageNumber: page.pageNumber,
                  pageLayout: page.pageLayout,
                  panelCount: page.panelCount,
                  imageUrl: page.imageUrl || '', // 页面的合成图片
                  status: page.status,
                  panels,
                }
              })
            )

            return {
              ...episode,
              pages: pagesWithPanels,
            }
          })
        )

        return {
          ...volume,
          episodes: episodesWithPages,
        }
      })
    )

    // 格式化响应数据
    const responseData = {
      id: comic.id,
      title: comic.title,
      slug: comic.slug,
      description: comic.description,
      category: comic.category,
      author: comic.author,
      status: comic.status,
      isPublic: comic.isPublic,
      viewCount: comic.viewCount,
      likeCount: comic.likeCount,
      model: comic.model,
      prompt: comic.prompt,
      coverImage: comic.coverImage,
      volumeCount: comic.volumeCount,
      episodeCount: comic.episodeCount,
      style: comic.style,
      createdAt: comic.createdAt,
      updatedAt: comic.updatedAt,
      tags: tagRelations.map(tr => ({
        id: tr.tagId ?? 0,
        name: tr.name ?? '',
        slug: tr.slug ?? '',
      })),
      volumes: volumesWithEpisodes,
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    })
  } catch (error) {
    console.error('获取漫画详情失败:', error)
    return NextResponse.json(
      { success: false, message: '获取漫画详情失败' },
      { status: 500 },
    )
  }
}
