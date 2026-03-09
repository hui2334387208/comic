import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { comics, comicCategories } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const userId = session.user.id

    // 获取创作者的所有作品
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
        favoriteCount: comics.favoriteCount,
        commentCount: comics.commentCount,
        volumeCount: comics.volumeCount,
        episodeCount: comics.episodeCount,
        style: comics.style,
        language: comics.language,
        createdAt: comics.createdAt,
        updatedAt: comics.updatedAt,
        categoryId: comics.categoryId,
        categoryName: comicCategories.name,
        categorySlug: comicCategories.slug,
        categoryIcon: comicCategories.icon,
        categoryColor: comicCategories.color,
      })
      .from(comics)
      .leftJoin(comicCategories, eq(comics.categoryId, comicCategories.id))
      .where(eq(comics.authorId, userId))
      .orderBy(desc(comics.createdAt))

    return NextResponse.json({
      success: true,
      data: {
        comics: userComics.map(comic => ({
          ...comic,
          category: comic.categoryId ? {
            id: comic.categoryId,
            name: comic.categoryName,
            slug: comic.categorySlug,
            icon: comic.categoryIcon,
            color: comic.categoryColor,
          } : null,
        })),
      },
    })
  } catch (error) {
    console.error('获取作品列表失败:', error)
    return NextResponse.json(
      { success: false, error: '获取作品列表失败' },
      { status: 500 }
    )
  }
}
