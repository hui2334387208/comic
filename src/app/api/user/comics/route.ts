import { eq, desc } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { comics, comicCategories } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'

// GET /api/user/comics - 获取用户创建的漫画列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const userComics = await db
      .select({
        id: comics.id,
        title: comics.title,
        slug: comics.slug,
        description: comics.description,
        coverImage: comics.coverImage,
        status: comics.status,
        isPublic: comics.isPublic,
        viewCount: comics.viewCount,
        likeCount: comics.likeCount,
        volumeCount: comics.volumeCount,
        episodeCount: comics.episodeCount,
        createdAt: comics.createdAt,
        category: {
          id: comicCategories.id,
          name: comicCategories.name,
          slug: comicCategories.slug,
        },
      })
      .from(comics)
      .leftJoin(comicCategories, eq(comics.categoryId, comicCategories.id))
      .where(eq(comics.authorId, userId))
      .orderBy(desc(comics.createdAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      success: true,
      data: {
        comics: userComics,
        pagination: {
          page,
          limit,
        },
      },
    })
  } catch (error) {
    console.error('获取用户漫画失败:', error)
    return NextResponse.json(
      { error: '获取用户漫画失败' },
      { status: 500 },
    )
  }
}
