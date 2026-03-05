export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { generateEpisode } from '@/lib/creator/ai-generator'

/**
 * 创作者端 - AI 生成话内容（只生成标题和描述）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { episodeNumber, prompt, comicTitle, comicDescription, comicStyle, comicCategory, comicTags, previousEpisodes, model } = body || {}

    if (!episodeNumber) {
      return NextResponse.json({ error: '请提供话数' }, { status: 400 })
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: '请提供有效的prompt参数' }, { status: 400 })
    }

    const result = await generateEpisode(
      prompt,
      episodeNumber,
      comicTitle,
      comicDescription,
      comicStyle,
      comicCategory,
      comicTags,
      previousEpisodes,
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
    console.error('创作者端 - 话生成失败:', error)
    return NextResponse.json({
      success: false,
      error: '话生成失败',
      detail: error?.message
    }, { status: 500 })
  }
}
