import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { comics } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    // 获取用户的作品审核记录
    let query = db
      .select()
      .from(comics)
      .where(eq(comics.authorId, parseInt(session.user.id)))

    const allComics = await query

    // 根据状态过滤
    let filteredComics = allComics
    if (status !== 'all') {
      filteredComics = allComics.filter(comic => comic.status === status)
    }

    const reviews = filteredComics.map(comic => ({
      id: comic.id,
      comicId: comic.id,
      title: comic.title,
      coverImage: comic.coverImage,
      status: comic.status || 'draft',
      submittedAt: comic.createdAt,
      reason: comic.rejectReason || null,
    }))

    return NextResponse.json({
      success: true,
      data: { reviews },
    })
  } catch (error) {
    console.error('获取审核记录失败:', error)
    return NextResponse.json({ success: false, error: '获取数据失败' }, { status: 500 })
  }
}
