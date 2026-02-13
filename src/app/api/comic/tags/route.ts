import { NextResponse } from 'next/server'
import { fetchComicTagsForServer } from '@/server/comics'

// GET /api/comic/tags - 获取漫画标签列表
export async function GET() {
  try {
    const tags = await fetchComicTagsForServer()
    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error in GET /api/comic/tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comic tags' },
      { status: 500 }
    )
  }
}
