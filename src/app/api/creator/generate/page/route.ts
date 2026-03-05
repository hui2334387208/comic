export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { generatePage } from '@/lib/creator/ai-generator'

/**
 * 创作者端 - AI 生成页内容
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pageNumber, prompt, comicTitle, comicDescription, comicStyle, comicCategory, comicTags, episodeTitle, episodeDescription, previousPages, model } = body || {}

    if (!pageNumber) {
      return NextResponse.json({ error: '请提供页码' }, { status: 400 })
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: '请提供有效的prompt参数' }, { status: 400 })
    }

    if (!episodeTitle) {
      return NextResponse.json({ error: '请提供话标题' }, { status: 400 })
    }

    const result = await generatePage(
      pageNumber,
      prompt,
      comicTitle,
      comicDescription,
      comicStyle,
      comicCategory,
      comicTags,
      episodeTitle,
      episodeDescription,
      previousPages,
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
    console.error('创作者端 - 页生成失败:', error)
    return NextResponse.json({
      success: false,
      error: '页生成失败',
      detail: error?.message
    }, { status: 500 })
  }
}
