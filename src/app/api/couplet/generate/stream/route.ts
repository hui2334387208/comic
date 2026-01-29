export const runtime = 'edge'
import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { deepseek } from '@ai-sdk/deepseek'

import { generateCoupletPrompt } from '@/lib/ai-classification'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { prompt, language } = body || {}

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: '请提供有效的prompt参数' }), { status: 400 })
    }

    const modelName = process.env.DEEPSEEK_MODEL
    if (!modelName) {
      return new Response(JSON.stringify({ error: '服务未配置 DEEPSEEK_MODEL 环境变量' }), { status: 500 })
    }
    const aiModel = deepseek(modelName)
    const coupletPrompt = generateCoupletPrompt(prompt, language)

    const result = await streamText({
      model: aiModel,
      prompt: coupletPrompt,
      maxTokens: Number(process.env.COUPLET_STREAM_MAX_TOKENS || 2048),
      temperature: Number(process.env.COUPLET_STREAM_TEMPERATURE || 0.7),
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let buffer = ''
        try {
          for await (const chunk of result.textStream) {
            buffer += chunk
            let newlineIndex = buffer.indexOf('\n')
            while (newlineIndex !== -1) {
              const line = buffer.slice(0, newlineIndex).trim()
              if (line) controller.enqueue(encoder.encode(line + '\n'))
              buffer = buffer.slice(newlineIndex + 1)
              newlineIndex = buffer.indexOf('\n')
            }
          }
          const tail = buffer.trim()
          if (tail) controller.enqueue(encoder.encode(tail + '\n'))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'AI流式生成失败', detail: error?.message }), { status: 500 })
  }
}

