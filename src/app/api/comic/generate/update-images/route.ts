import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { comics, comicPanels, comicEpisodes } from '@/db/schema'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { comicId, coverUrl, imageUrls } = body || {}

    if (!comicId) {
      return NextResponse.json({ error: '请提供漫画ID' }, { status: 400 })
    }

    console.log(`更新漫画${comicId}的图片URL`)

    await db.transaction(async (tx) => {
      // 更新漫画封面
      if (coverUrl) {
        await tx
          .update(comics)
          .set({
            coverImage: coverUrl,
            updatedAt: new Date()
          })
          .where(eq(comics.id, comicId))

        console.log(`更新漫画封面: ${coverUrl}`)
      }

      // 更新分镜图片URL
      if (imageUrls && Array.isArray(imageUrls)) {
        // 获取该漫画的所有分镜，按顺序排列
        const panels = await tx
          .select({
            id: comicPanels.id,
            episodeId: comicPanels.episodeId,
            imageNumber: comicPanels.imageNumber
          })
          .from(comicPanels)
          .innerJoin(comicEpisodes, eq(comicPanels.episodeId, comicEpisodes.id))
          .where(eq(comicEpisodes.comicId, comicId))
          .orderBy(comicEpisodes.episodeNumber, comicPanels.imageNumber)

        console.log(`找到${panels.length}个分镜，准备更新${imageUrls.length}个图片URL`)

        // 更新每个分镜的图片URL
        for (let i = 0; i < panels.length && i < imageUrls.length; i++) {
          const panel = panels[i]
          const imageUrl = imageUrls[i]

          if (imageUrl) {
            await tx
              .update(comicPanels)
              .set({
                imageUrl,
                generationStatus: 'success',
                updatedAt: new Date()
              })
              .where(eq(comicPanels.id, panel.id))

            console.log(`更新分镜${i + 1}的图片URL`)
          }
        }
      }
    })

    const updatedCount = imageUrls ? imageUrls.filter((url: string) => url).length : 0
    console.log(`漫画${comicId}图片URL更新完成，成功更新${updatedCount}张图片`)

    return NextResponse.json({
      success: true,
      data: {
        comicId,
        updatedCount,
        coverUpdated: !!coverUrl,
        message: '图片URL更新成功'
      }
    })

  } catch (error: any) {
    console.error('更新图片URL失败:', error)
    return NextResponse.json({ 
      success: false, 
      error: '更新图片URL失败', 
      detail: error?.message 
    }, { status: 500 })
  }
}