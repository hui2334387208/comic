import { eq, desc, count } from 'drizzle-orm'
import { db } from '@/db'
import { comicVersions, comicPanels, comicEpisodes, comicPages } from '@/db/schema'

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
      .orderBy(desc(comicVersions.version))

    // 为每个版本计算帧数（分镜格数）
    const versionsWithFrameCount = await Promise.all(
      versions.map(async (version) => {
        // 统计该版本下所有的分镜格数量
        // 路径：version -> episodes -> pages -> panels
        const [result] = await db
          .select({
            frameCount: count(comicPanels.id)
          })
          .from(comicPanels)
          .innerJoin(comicPages, eq(comicPanels.pageId, comicPages.id))
          .innerJoin(comicEpisodes, eq(comicPages.episodeId, comicEpisodes.id))
          .where(eq(comicEpisodes.versionId, version.id))

        return {
          ...version,
          frameCount: result?.frameCount || 0
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