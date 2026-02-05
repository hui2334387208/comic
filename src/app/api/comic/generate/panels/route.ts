export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { volumes, style = 'anime', comicId } = body || {}

    if (!volumes || !Array.isArray(volumes) || volumes.length === 0) {
      return NextResponse.json({ error: '请提供有效的卷数据' }, { status: 400 })
    }

    // 收集所有分镜
    const allPanels: any[] = []
    let totalPanels = 0
    
    for (const volume of volumes) {
      if (volume.episodes && Array.isArray(volume.episodes)) {
        for (const episode of volume.episodes) {
          if (episode.panels && Array.isArray(episode.panels)) {
            allPanels.push(...episode.panels)
            totalPanels += episode.panels.length
          }
        }
      }
    }

    if (totalPanels === 0) {
      return NextResponse.json({ error: '没有找到需要生成的分镜' }, { status: 400 })
    }

    console.log(`开始为漫画${comicId}生成${totalPanels}张分镜图片`)
    
    const imageUrls: string[] = []
    const errors: string[] = []
    
    // 为每个分镜生成图片
    for (let i = 0; i < allPanels.length; i++) {
      const panel = allPanels[i]
      console.log(`正在生成第${i + 1}张分镜图片...`)
      
      if (!panel?.sceneDescription) {
        console.warn(`分镜${i + 1}缺少场景描述，跳过`)
        imageUrls.push('')
        errors.push(`分镜${i + 1}: 缺少场景描述`)
        continue
      }

      // 构建图片描述提示词，包含完整的分镜信息
      const imagePrompt = `${panel.sceneDescription}，${panel.dialogue ? '对话："' + panel.dialogue + '"' : ''}，${panel.narration ? '旁白：' + panel.narration : ''}，${panel.emotion || '平静'}的氛围，${panel.cameraAngle || '正面视角'}，${panel.characters ? '角色：' + panel.characters : ''}，漫画风格，${style}风格，高质量，详细绘制，清晰画面`

      try {
        console.log(`分镜${i + 1}提示词:`, imagePrompt)
        
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
            console.log(`分镜${i + 1}生成成功:`, imageUrl)
          } else {
            console.error(`分镜${i + 1}生成失败，API返回:`, result)
            imageUrls.push('')
            errors.push(`分镜${i + 1}: API返回无效结果`)
          }
        } else {
          const errorText = await response.text()
          console.error(`分镜${i + 1}API调用失败，状态码:${response.status}，错误:`, errorText)
          imageUrls.push('')
          errors.push(`分镜${i + 1}: API调用失败 (${response.status})`)
        }
      } catch (error) {
        console.error(`分镜${i + 1}生成异常:`, error)
        imageUrls.push('')
        errors.push(`分镜${i + 1}: ${error instanceof Error ? error.message : '未知错误'}`)
      }

      // 添加延迟避免API限流，最后一个不需要延迟
      if (i < allPanels.length - 1) {
        console.log(`等待2秒后生成下一张分镜图片...`)
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2秒延迟
      }
    }

    const successCount = imageUrls.filter(url => url).length
    console.log(`漫画${comicId}分镜图片生成完成: ${successCount}/${totalPanels} 成功`)

    // 如果没有任何图片生成成功，返回失败
    if (successCount === 0) {
      return NextResponse.json({
        success: false,
        error: '所有分镜图片生成失败',
        detail: errors.join('; '),
        data: {
          imageUrls,
          comicId,
          panelCount: totalPanels,
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
        panelCount: totalPanels,
        successCount,
        errors: errors.length > 0 ? errors : undefined
      }
    })

  } catch (error: any) {
    console.error('分镜图片生成失败:', error)
    return NextResponse.json({ 
      success: false, 
      error: '分镜图片生成失败', 
      detail: error?.message 
    }, { status: 500 })
  }
}