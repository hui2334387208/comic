import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { comicVersions, comicPanels, comicEpisodes } from '@/db/schema'

export async function fetchComicVersionsForServer(comicId: number) {
  try {
    // 获取所有版本
    const versions = await db
      .select({
        id: comicVersions.id,
        comicId: comicVersions.comicId,
        version: comicVersions.version,
        parentVersionId: comicVersions.parentVersionId,
        versionDescription: comicVersions.versionDescription,
        isLatestVersion: comicVersions.isLatestVersion,
        createdAt: comicVersions.createdAt,
        updatedAt: comicVersions.updatedAt,
      })
      .from(comicVersions)
      .where(eq(comicVersions.comicId, comicId))
      .orderBy(comicVersions.version)

    // 为每个版本计算帧数
    const versionsWithFrameCount = await Promise.all(
      versions.map(async (version) => {
        const [frameCountResult] = await db
          .select({
            frameCount: comicPanels.id
          })
          .from(comicPanels)
          .innerJoin(comicEpisodes, eq(comicPanels.episodeId, comicEpisodes.id))
          .where(eq(comicEpisodes.versionId, version.id))

        // 计算实际帧数
        const frameCountQuery = await db
          .select()
          .from(comicPanels)
          .innerJoin(comicEpisodes, eq(comicPanels.episodeId, comicEpisodes.id))
          .where(eq(comicEpisodes.versionId, version.id))

        return {
          ...version,
          frameCount: frameCountQuery.length
        }
      })
    )

    return {
      success: true,
      data: {
        versions: versionsWithFrameCount
      }
    }
  } catch (error) {
    console.error('获取漫画版本失败:', error)
    return { success: false, error: '获取漫画版本失败' }
  }
}