import { NextResponse } from 'next/server'
import { fetchComicCategoriesForServer } from '@/server/categories'

// GET /api/comic/categories - 获取漫画分类列表
export async function GET() {
  try {
    const categories = await fetchComicCategoriesForServer()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error in GET /api/comic/categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comic categories' },
      { status: 500 }
    )
  }
}
