export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { generateComicCategory } from '@/lib/creator/ai-generator'

/**
 * 创作者端 - AI 生成漫画分类
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { prompt, title, description, model, language } = body || {}
		
		if (!prompt || typeof prompt !== 'string') {
			return NextResponse.json({ error: '请提供有效的prompt参数' }, { status: 400 })
		}

		const result = await generateComicCategory(prompt, title, description, model || 'deepseek-chat', language || 'zh')
		
		if (!result.success) {
			return NextResponse.json(result, { status: 500 })
		}

		return NextResponse.json({
			success: true,
			data: result.data
		})

	} catch (error: any) {
		console.error('创作者端 - 分类生成失败:', error)
		return NextResponse.json({ 
			success: false, 
			error: '分类生成失败', 
			detail: error?.message 
		}, { status: 500 })
	}
}
