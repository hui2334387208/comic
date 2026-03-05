export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { generatePanel } from '@/lib/creator/ai-generator'

/**
 * 创作者端 - AI 生成分镜内容
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { panelNumber, prompt, comicTitle, comicDescription, comicStyle, comicCategory, comicTags, episodeTitle, episodeDescription, pageLayout, panelCount, previousPanels, model } = body || {}

    if (!panelNumber) {
      return NextResponse.json({ error: '请提供分镜编号' }, { status: 400 })
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: '请提供有效的prompt参数' }, { status: 400 })
    }

    if (!episodeTitle) {
      return NextResponse.json({ error: '请提供话标题' }, { status: 400 })
    }

    const result = await generatePanel(
      panelNumber,
      prompt,
      comicTitle,
      comicDescription,
      comicStyle,
      comicCategory,
      comicTags,
      episodeTitle,
      episodeDescription,
      pageLayout,
      panelCount,
      previousPanels,
      model || 'deepseek-chat'
    )

    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error: any) {
    console.error('创作者端 - 分镜生成失败:', error)
    return NextResponse.json({
      success: false,
      error: '分镜生成失败',
      detail: error?.message
    }, { status: 500 })
  }
}
