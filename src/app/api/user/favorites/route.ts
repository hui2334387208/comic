import { eq, desc, inArray } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { comics, comicCategories, comicFavorites } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'

// GET /api/user/favorites - 获取用户收藏的漫画列表
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

    const favoriteRows = await db
      .select({
        comicId: comicFavorites.comicId,
        favoritedAt: comicFavorites.createdAt,
      })
      .from(comicFavorites)
      .where(eq(comicFavorites.userId, userId))
      .orderBy(desc(comicFavorites.createdAt))
      .limit(limit)
      .offset(offset)

    const comicIds = favoriteRows.map((row) => row.comicId)

    let favoritedComics: any[] = []
    if (comicIds.length > 0) {
      favoritedComics = await db
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
        .where(inArray(comics.id, comicIds))
    }

    const favorites = favoriteRows.map((fav) => {
      const comic = favoritedComics.find((c) => c.id === fav.comicId)
      return {
        ...comic,
        favoritedAt: fav.favoritedAt,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        favorites,
        pagination: {
          page,
          limit,
        },
      },
    })
  } catch (error) {
    console.error('获取用户收藏失败:', error)
    return NextResponse.json(
      { error: '获取用户收藏失败' },
      { status: 500 },
    )
  }
}
