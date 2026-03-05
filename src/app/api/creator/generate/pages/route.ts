import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

/**
 * 创作者端 - 生成漫画图片（根据分镜生成）
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const { episode, style = 'anime' } = body || {}

    if (!episode || !episode.pages || episode.pages.length === 0) {
      return NextResponse.json({ error: '请提供话和页数据' }, { status: 400 })
    }

    console.log(`开始生成${episode.pages.length}张页面图片`)
    
    const imageUrls: string[] = []
    const errors: string[] = []
    let successCount = 0
    
    // 为每个页面生成图片
    for (let i = 0; i < episode.pages.length; i++) {
      const page = episode.pages[i]
      console.log(`正在生成第${i + 1}页漫画图片...`)
      
      if (!page.panels || page.panels.length === 0) {
        console.warn(`第${i + 1}页没有分镜，跳过`)
        imageUrls.push('')
        errors.push(`第${i + 1}页: 没有分镜数据`)
        continue
      }
      
      // 组合该页面所有分镜信息生成提示词
      const panelDescriptions = page.panels.map((panel: any, idx: number) => {
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
            successCount++
            console.log(`第${i + 1}页生成成功:`, imageUrl)
          } else {
            console.error(`第${i + 1}页生成失败，API返回:`, result)
            imageUrls.push('')
            errors.push(`第${i + 1}页: API返回无效结果`)
          }
        } else {
          const errorText = await response.text()
          console.error(`第${i + 1}页API调用失败，状态码:${response.status}，错误:`, errorText)
          imageUrls.push('')
          errors.push(`第${i + 1}页: API调用失败 (${response.status})`)
        }
      } catch (error) {
        console.error(`第${i + 1}页生成异常:`, error)
        imageUrls.push('')
        const errorMsg = error instanceof Error ? error.message : '未知错误'
        errors.push(`第${i + 1}页: ${errorMsg}`)
      }

      // 添加延迟避免API限流
      if (i < episode.pages.length - 1) {
        console.log(`等待2秒后生成下一页图片...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    console.log(`页面图片生成完成: ${successCount}/${episode.pages.length} 成功`)

    return NextResponse.json({
      success: true,
      data: {
        imageUrls,
        pageCount: episode.pages.length,
        successCount,
        errors: errors.length > 0 ? errors : undefined
      }
    })

  } catch (error: any) {
    console.error('生成漫画图片失败:', error)
    return NextResponse.json({ error: '生成漫画图片失败', detail: error?.message }, { status: 500 })
  }
}
