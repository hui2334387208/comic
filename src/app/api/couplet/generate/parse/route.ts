export const runtime = 'edge'

import { NextRequest } from 'next/server'

import { parseCoupletText } from '@/lib/ai-classification'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body || {}

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: '请提供有效的text参数' }), { status: 400 })
    }

    // parseCoupletText 同时支持 NDJSON(JSONL) 与 @横批@上联@下联 的回退格式
    const contents = parseCoupletText(text)
    return new Response(JSON.stringify({ success: true, data: { contents, totalContents: contents.length } }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: '解析失败', detail: error?.message }), { status: 500 })
  }
}

