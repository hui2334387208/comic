import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { 
  comics, 
  comicVersions, 
  comicEpisodes, 
  comicPages, 
  comicPanels,
  comicTagRelations 
} from '@/db/schema'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    
    const { comicInfo, episodes } = body

    // 验证必填字段
    if (!comicInfo?.title || !comicInfo?.description) {
      return NextResponse.json({ error: '请填写漫画标题和描述' }, { status: 400 })
    }

    if (!episodes || episodes.length === 0) {
      return NextResponse.json({ error: '请至少创建一话内容' }, { status: 400 })
    }

    // 生成slug
    const slug = `${comicInfo.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`

    // 开始事务：创建漫画及相关数据
    const result = await db.transaction(async (tx) => {
      // 1. 创建漫画基本信息
      const [comic] = await tx.insert(comics).values({
        title: comicInfo.title,
        slug,
        description: comicInfo.description,
        categoryId: comicInfo.category || null,
        styleId: comicInfo.style || null,
        authorId: userId,
        status: 'published',
        isPublic: true,
        coverImage: comicInfo.coverImage || null,
        prompt: comicInfo.prompt || null,
        episodeCount: episodes.length,
        language: 'zh',
      }).returning()

      // 2. 创建版本记录
      const [version] = await tx.insert(comicVersions).values({
        comicId: comic.id,
        version: 1,
        versionDescription: '初始版本',
        isLatestVersion: true,
      }).returning()

      // 3. 创建标签关联
      if (comicInfo.tags && comicInfo.tags.length > 0) {
        await tx.insert(comicTagRelations).values(
          comicInfo.tags.map((tagId: number) => ({
            comicId: comic.id,
            tagId,
          }))
        )
      }

      // 4. 创建话、页、分镜数据
      for (let i = 0; i < episodes.length; i++) {
        const episode = episodes[i]
        
        // 创建话
        const [episodeRecord] = await tx.insert(comicEpisodes).values({
          comicId: comic.id,
          versionId: version.id,
          episodeNumber: i + 1,
          title: episode.name || `第${i + 1}话`,
          description: episode.description || null,
          pageCount: episode.pages?.length || 0,
          status: 'published',
        }).returning()

        // 创建页和分镜
        if (episode.pages && episode.pages.length > 0) {
          for (let j = 0; j < episode.pages.length; j++) {
            const page = episode.pages[j]
            
            // 创建页
            const [pageRecord] = await tx.insert(comicPages).values({
              episodeId: episodeRecord.id,
              pageNumber: j + 1,
              pageLayout: page.pageLayout || 'single',
              panelCount: page.panels?.length || 0,
              imageUrl: page.imageUrl || null,
              status: 'published',
            }).returning()

            // 创建分镜
            if (page.panels && page.panels.length > 0) {
              await tx.insert(comicPanels).values(
                page.panels.map((panel: any, k: number) => ({
                  pageId: pageRecord.id,
                  panelNumber: k + 1,
                  sceneDescription: panel.sceneDescription || null,
                  dialogue: panel.dialogue || null,
                  narration: panel.narration || null,
                  emotion: panel.emotion || null,
                  cameraAngle: panel.cameraAngle || null,
                  characters: panel.characters || null,
                }))
              )
            }
          }
        }
      }

      return { comic, version }
    })

    return NextResponse.json({
      success: true,
      data: {
        comicId: result.comic.id,
        slug: result.comic.slug,
        message: '作品发布成功！',
      },
    })
  } catch (error) {
    console.error('发布作品失败:', error)
    return NextResponse.json(
      { success: false, error: '发布作品失败，请重试' },
      { status: 500 }
    )
  }
}
