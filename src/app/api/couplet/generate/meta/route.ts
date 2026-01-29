export const runtime = 'edge'

import { NextRequest } from 'next/server'

import { generateMetaFromPrompt } from '@/lib/ai-classification'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { prompt, model, language } = body || {}
		if (!prompt || typeof prompt !== 'string') {
			return new Response(JSON.stringify({ error: '请提供有效的prompt参数' }), { status: 400 })
		}

		const result = await generateMetaFromPrompt(prompt, model, language)
		return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } })
	} catch (error: any) {
		return new Response(JSON.stringify({ success: false, error: '元信息生成失败', detail: error?.message }), { status: 500 })
	}
}

