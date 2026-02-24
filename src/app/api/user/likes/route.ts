import { eq, desc, inArray } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { comics, comicCategories, comicLikes } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'

// GET /api/user/likes - 获取用户点赞的漫画列表
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

    const likeRows = await db
      .select({
        comicId: comicLikes.comicId,
        likedAt: comicLikes.createdAt,
      })
      .from(comicLikes)
      .where(eq(comicLikes.userId, userId))
      .orderBy(desc(comicLikes.createdAt))
      .limit(limit)
      .offset(offset)

    const comicIds = likeRows.map((row) => row.comicId)

    let likedComics: any[] = []
    if (comicIds.length > 0) {
      likedComics = await db
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

    const likes = likeRows.map((like) => {
      const comic = likedComics.find((c) => c.id === like.comicId)
      return {
        ...comic,
        likedAt: like.likedAt,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        likes,
        pagination: {
          page,
          limit,
        },
      },
    })
  } catch (error) {
    console.error('获取用户点赞失败:', error)
    return NextResponse.json(
      { error: '获取用户点赞失败' },
      { status: 500 },
    )
  }
}
