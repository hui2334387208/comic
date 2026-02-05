export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, style = 'anime', comicId } = body || {}

    if (!title || !description) {
      return NextResponse.json({ error: '请提供标题和描述' }, { status: 400 })
    }

    // 构建封面描述提示词
    const coverPrompt = `${title}，${description}，漫画封面，精美插画，${style}风格，高质量，详细绘制`

    // 调用阿里云通义万象wan2.6-t2i模型生成封面
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
              text: coverPrompt
            }]
          }]
        },
        parameters: {
          negative_prompt: '',
          prompt_extend: true,
          watermark: false,
          n: 1,
          size: '1280*1280'
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('阿里云API调用失败:', errorText)
      return NextResponse.json({ 
        success: false, 
        error: '封面生成失败', 
        detail: errorText 
      }, { status: 500 })
    }

    const result = await response.json()
    
    if (result.output?.choices?.[0]?.message?.content?.[0]?.image) {
      const coverUrl = result.output?.choices?.[0]?.message?.content?.[0]?.image
      
      return NextResponse.json({
        success: true,
        data: {
          coverUrl,
          comicId,
          prompt: coverPrompt
        }
      })
    } else {
      console.error('封面生成结果异常:', result)
      return NextResponse.json({ 
        success: false, 
        error: '封面生成失败', 
        detail: '未获取到有效的图片URL' 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('封面生成失败:', error)
    return NextResponse.json({ 
      success: false, 
      error: '封面生成失败', 
      detail: error?.message 
    }, { status: 500 })
  }
}