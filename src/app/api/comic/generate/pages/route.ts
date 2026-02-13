import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { comicPages, comicEpisodes, comicVolumes, comicPanels, comics } from '@/db/schema/comic'
import { eq, asc } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { comicId } = body || {}

    if (!comicId) {
      return NextResponse.json({ error: '请提供comicId' }, { status: 400 })
    }

    // 查询漫画信息获取风格
    const [comic] = await db
      .select({ style: comics.style })
      .from(comics)
      .where(eq(comics.id, comicId))
      .limit(1)
    
    if (!comic) {
      return NextResponse.json({ error: '漫画不存在' }, { status: 404 })
    }
    
    const style = comic.style || 'anime'

    // 从数据库查询该漫画的所有页面记录（按顺序）
    const dbVolumes = await db
      .select()
      .from(comicVolumes)
      .where(eq(comicVolumes.comicId, comicId))
      .orderBy(asc(comicVolumes.volumeNumber))

    // 收集所有页面及其分镜信息
    const allPages: Array<{
      id: number
      pageNumber: number
      pageLayout: string | null
      panels: Array<{
        sceneDescription: string | null
        dialogue: string | null
        narration: string | null
        emotion: string | null
        cameraAngle: string | null
        characters: string | null
      }>
    }> = []
    
    for (const dbVolume of dbVolumes) {
      const dbEpisodes = await db
        .select()
        .from(comicEpisodes)
        .where(eq(comicEpisodes.volumeId, dbVolume.id))
        .orderBy(asc(comicEpisodes.episodeNumber))
      
      for (const dbEpisode of dbEpisodes) {
        const pages = await db
          .select()
          .from(comicPages)
          .where(eq(comicPages.episodeId, dbEpisode.id))
          .orderBy(asc(comicPages.pageNumber))
        
        for (const page of pages) {
          // 查询该页的所有分镜
          const panels = await db
            .select({
              sceneDescription: comicPanels.sceneDescription,
              dialogue: comicPanels.dialogue,
              narration: comicPanels.narration,
              emotion: comicPanels.emotion,
              cameraAngle: comicPanels.cameraAngle,
              characters: comicPanels.characters
            })
            .from(comicPanels)
            .where(eq(comicPanels.pageId, page.id))
            .orderBy(asc(comicPanels.panelNumber))
          
          allPages.push({
            id: page.id,
            pageNumber: page.pageNumber,
            pageLayout: page.pageLayout,
            panels
          })
        }
      }
    }

    const totalPages = allPages.length
    
    if (totalPages === 0) {
      return NextResponse.json({ error: '没有找到需要生成的页面' }, { status: 400 })
    }

    console.log(`开始为漫画${comicId}生成${totalPages}张页面图片`)
    
    const imageUrls: string[] = []
    const errors: string[] = []
    
    // 为每个页面生成图片（组合该页面所有分镜信息）
    for (let i = 0; i < allPages.length; i++) {
      const page = allPages[i]
      console.log(`正在生成第${i + 1}页漫画图片... (页面ID: ${page.id})`)
      
      if (!page.panels || page.panels.length === 0) {
        console.warn(`第${i + 1}页没有分镜信息，跳过`)
        imageUrls.push('')
        errors.push(`第${i + 1}页: 没有分镜信息`)
        
        // 更新状态为失败
        try {
          await db.update(comicPages)
            .set({ 
              status: 'failed',
              updatedAt: new Date()
            })
            .where(eq(comicPages.id, page.id))
        } catch (dbError) {
          console.error(`更新页面${page.id}状态失败:`, dbError)
        }
        
        continue
      }
      
      // 先更新状态为生成中
      try {
        await db.update(comicPages)
          .set({ 
            status: 'generating',
            updatedAt: new Date()
          })
          .where(eq(comicPages.id, page.id))
      } catch (dbError) {
        console.error(`更新页面${page.id}状态失败:`, dbError)
      }

      // 组合该页面所有分镜信息生成提示词
      const panelDescriptions = page.panels.map((panel, idx) => {
        const parts = [`第${idx + 1}格`]
        if (panel.sceneDescription) parts.push(panel.sceneDescription)
        if (panel.dialogue) parts.push(`对话："${panel.dialogue}"`)
        if (panel.narration) parts.push(`旁白：${panel.narration}`)
        if (panel.emotion) parts.push(`${panel.emotion}的氛围`)
        if (panel.cameraAngle) parts.push(panel.cameraAngle)
        if (panel.characters) parts.push(`角色：${panel.characters}`)
        return parts.join('，')
      }).join('；')

      const imagePrompt = `漫画页面，${page.pageLayout || '多格布局'}，包含${page.panels.length}个分镜格子。${panelDescriptions}。漫画风格，${style}风格，高质量，详细绘制，清晰画面，专业分镜布局`

      try {
        console.log(`第${i + 1}页提示词:`, imagePrompt)
        
        // 调用阿里云通义万象wan2.6-t2i模型生成图片
        const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`
          },
          body: JSON.stringify({
            model: 'wan2.6-t2i',
            input: {
              messages: [{
                role: 'user',
                content: [{
                  text: imagePrompt
                }]
              }]
            },
            parameters: {
              negative_prompt: '模糊，低质量，变形，扭曲，文字，水印',
              prompt_extend: true,
              watermark: false,
              n: 1,
              size: '1280*1280'
            }
          })
        })

        if (response.ok) {
          const result = await response.json()
          if (result.output?.choices?.[0]?.message?.content?.[0]?.image) {
            const imageUrl = result.output.choices[0].message.content[0].image
            imageUrls.push(imageUrl)
            console.log(`第${i + 1}页生成成功:`, imageUrl)
            
            // 更新数据库
            try {
              await db.update(comicPages)
                .set({ 
                  imageUrl,
                  status: 'published',
                  updatedAt: new Date()
                })
                .where(eq(comicPages.id, page.id))
              
              console.log(`页面${page.id}的imageUrl已更新到数据库`)
            } catch (dbError) {
              console.error(`更新页面${page.id}到数据库失败:`, dbError)
            }
          } else {
            console.error(`第${i + 1}页生成失败，API返回:`, result)
            imageUrls.push('')
            const errorMsg = 'API返回无效结果'
            errors.push(`第${i + 1}页: ${errorMsg}`)
            
            // 更新失败状态
            try {
              await db.update(comicPages)
                .set({ 
                  status: 'failed',
                  updatedAt: new Date()
                })
                .where(eq(comicPages.id, page.id))
            } catch (dbError) {
              console.error(`更新页面${page.id}状态失败:`, dbError)
            }
          }
        } else {
          const errorText = await response.text()
          console.error(`第${i + 1}页API调用失败，状态码:${response.status}，错误:`, errorText)
          imageUrls.push('')
          const errorMsg = `API调用失败 (${response.status})`
          errors.push(`第${i + 1}页: ${errorMsg}`)
          
          // 更新失败状态
          try {
            await db.update(comicPages)
              .set({ 
                status: 'failed',
                updatedAt: new Date()
              })
              .where(eq(comicPages.id, page.id))
          } catch (dbError) {
            console.error(`更新页面${page.id}状态失败:`, dbError)
          }
        }
      } catch (error) {
        console.error(`第${i + 1}页生成异常:`, error)
        imageUrls.push('')
        const errorMsg = error instanceof Error ? error.message : '未知错误'
        errors.push(`第${i + 1}页: ${errorMsg}`)
        
        // 更新失败状态
        try {
          await db.update(comicPages)
            .set({ 
              status: 'failed',
              updatedAt: new Date()
            })
            .where(eq(comicPages.id, page.id))
        } catch (dbError) {
          console.error(`更新页面${page.id}状态失败:`, dbError)
        }
      }

      // 添加延迟避免API限流，最后一个不需要延迟
      if (i < allPages.length - 1) {
        console.log(`等待2秒后生成下一页图片...`)
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2秒延迟
      }
    }

    const successCount = imageUrls.filter(url => url).length
    console.log(`漫画${comicId}页面图片生成完成: ${successCount}/${totalPages} 成功`)

    // 如果没有任何图片生成成功，返回失败
    if (successCount === 0) {
      return NextResponse.json({
        success: false,
        error: '所有页面图片生成失败',
        detail: errors.join('; '),
        data: {
          imageUrls,
          comicId,
          pageCount: totalPages,
          successCount: 0,
          errors
        }
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        imageUrls,
        comicId,
        pageCount: totalPages,
        successCount,
        errors: errors.length > 0 ? errors : undefined
      }
    })

  } catch (error: any) {
    console.error('页面图片生成失败:', error)
    return NextResponse.json({ 
      success: false, 
      error: '页面图片生成失败', 
      detail: error?.message 
    }, { status: 500 })
  }
}
