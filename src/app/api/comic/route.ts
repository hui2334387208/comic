import { NextRequest, NextResponse } from 'next/server'
import { fetchComicListForServer } from '@/server/comics'

// GET /api/comic - 获取漫画列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const sort = (searchParams.get('sort') || 'latest') as 'latest' | 'hot' | 'contents'
    const category = searchParams.get('category') || null
    const search = searchParams.get('search') || null
    const language = searchParams.get('language') || 'zh'

    const result = await fetchComicListForServer({
      page,
      limit,
      sort,
      category,
      search,
      language,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/comic:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch comics',
      },
      { status: 500 }
    )
  }
}
