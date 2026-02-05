export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'

import { generateComicMetaFromPrompt } from '@/lib/ai-classification'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { prompt, model, language } = body || {}
		if (!prompt || typeof prompt !== 'string') {
			return NextResponse.json({ error: '请提供有效的prompt参数' }, { status: 400 })
		}

		// 使用 DeepSeek 一次性生成所有内容（标题、描述、分类、标签、剧本、分镜、风格）
		const metaResult = await generateComicMetaFromPrompt(prompt, model, language)
		
		if (!metaResult.success) {
			return NextResponse.json(metaResult, { status: 500 })
		}

		return NextResponse.json({
			success: true,
			data: metaResult.data
		})

	} catch (error: any) {
		console.error('漫画内容生成失败:', error)
		return NextResponse.json({ 
			success: false, 
			error: '漫画内容生成失败', 
			detail: error?.message 
		}, { status: 500 })
	}
}