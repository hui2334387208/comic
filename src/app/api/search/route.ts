import { NextRequest, NextResponse } from 'next/server'

import { publicApiRateLimit } from '@/lib/rate-limit'

// 模拟搜索数据
const mockSearchData = [
  {
    id: 1,
    title: '辛弃疾生平',
    description: '南宋著名词人，抗金名将',
    type: 'person',
    relevance: 0.95,
    url: '/timeline/1',
  },
  {
    id: 2,
    title: '宋朝历史',
    description: '中国历史上重要的朝代',
    type: 'timeline',
    relevance: 0.88,
    url: '/timeline/2',
  },
  {
    id: 3,
    title: '靖康之耻',
    description: '北宋灭亡的重要历史事件',
    type: 'event',
    relevance: 0.82,
    url: '/timeline/3',
  },
]

// GET /api/search - 搜索接口
export async function GET(request: NextRequest) {
  try {
    const rateLimit = publicApiRateLimit(request)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: '请求过于频繁，请稍后再试' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter ?? Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
          },
        },
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        data: {
          results: [],
          total: 0,
          query,
        },
      })
    }

    // 模拟搜索逻辑
    const filteredResults = mockSearchData.filter(item => {
      const searchText = query.toLowerCase()
      const titleMatch = item.title.toLowerCase().includes(searchText)
      const descriptionMatch = item.description.toLowerCase().includes(searchText)

      if (type && type !== 'all') {
        return (titleMatch || descriptionMatch) && item.type === type
      }

      return titleMatch || descriptionMatch
    })

    // 按相关性排序
    filteredResults.sort((a, b) => b.relevance - a.relevance)

    // 限制结果数量
    const results = filteredResults.slice(0, limit)

    return NextResponse.json({
      success: true,
      data: {
        results,
        total: filteredResults.length,
        query,
        type: type || 'all',
      },
    })

  } catch (error) {
    console.error('搜索失败:', error)
    return NextResponse.json(
      { success: false, message: '搜索失败' },
      { status: 500 },
    )
  }
}
