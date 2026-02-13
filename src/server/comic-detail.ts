import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { 
  comics, 
  comicCategories, 
  comicVersions, 
  comicVolumes, 
  comicEpisodes, 
  comicPages,
  comicPanels,
  comicTags,
  comicTagRelations
} from '@/db/schema'

export async function fetchComicDetailForServer(comicId: number, versionId?: number | null) {
  try {
    // 获取漫画基本信息
    const [comic] = await db
      .select({
        id: comics.id,
        title: comics.title,
        description: comics.description,
        prompt: comics.prompt,
        model: comics.model,
        style: comics.style,
        coverImage: comics.coverImage,
        volumeCount: comics.volumeCount,
        episodeCount: comics.episodeCount,
        createdAt: comics.createdAt,
        category: {
          id: comicCategories.id,
          name: comicCategories.name,
          slug: comicCategories.slug,
          icon: comicCategories.icon,
        }
      })
      .from(comics)
      .leftJoin(comicCategories, eq(comics.categoryId, comicCategories.id))
      .where(eq(comics.id, comicId))
      .limit(1)

    if (!comic) {
      return { success: false, error: '漫画不存在' }
    }

    // 获取版本信息
    let targetVersionId = versionId
    if (!targetVersionId) {
      const [latestVersion] = await db
        .select({ id: comicVersions.id })
        .from(comicVersions)
        .where(and(
          eq(comicVersions.comicId, comicId),
          eq(comicVersions.isLatestVersion, true)
        ))
        .limit(1)
      targetVersionId = latestVersion?.id
    }

    if (!targetVersionId) {
      return { success: false, error: '找不到漫画版本' }
    }

    // 获取卷信息
    const volumes = await db
      .select({
        id: comicVolumes.id,
        volumeNumber: comicVolumes.volumeNumber,
        title: comicVolumes.title,
        description: comicVolumes.description,
        episodeCount: comicVolumes.episodeCount,
      })
      .from(comicVolumes)
      .where(and(
        eq(comicVolumes.comicId, comicId),
        eq(comicVolumes.versionId, targetVersionId)
      ))
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
          })
          .from(comicEpisodes)
          .where(and(
            eq(comicEpisodes.volumeId, volume.id),
            eq(comicEpisodes.versionId, targetVersionId)
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
                  ...page,
                  panels
                }
              })
            )

            return {
              ...episode,
              pages: pagesWithPanels
            }
          })
        )

        return {
          ...volume,
          episodes: episodesWithPages
        }
      })
    )

    // 获取标签
    const tags = await db
      .select({
        id: comicTags.id,
        name: comicTags.name,
        slug: comicTags.slug,
      })
      .from(comicTags)
      .innerJoin(comicTagRelations, eq(comicTags.id, comicTagRelations.tagId))
      .where(eq(comicTagRelations.comicId, comicId))

    return {
      success: true,
      data: {
        ...comic,
        volumes: volumesWithEpisodes,
        tags
      }
    }
  } catch (error) {
    console.error('获取漫画详情失败:', error)
    return { success: false, error: '获取漫画详情失败' }
  }
}