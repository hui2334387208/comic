import { eq, sql, like, and, or } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { videos } from '@/db/schema/video'
import { authOptions } from '@/lib/authOptions'

// 获取视频列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const offset = (page - 1) * limit


    // 构建查询条件
    const whereConditions = []

    // 搜索条件
    if (search) {
      whereConditions.push(
        or(
          sql`${videos.title}::text ILIKE ${`%${search}%`}`,
          sql`${videos.filename}::text ILIKE ${`%${search}%`}`,
        ),
      )
    }

    // 状态筛选
    if (status) {
      whereConditions.push(eq(videos.status, status))
    }

    // 执行查询
    const videoList = await db
      .select()
      .from(videos)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(sql`CASE 
        WHEN ${videos.status} = 'published' THEN 1
        WHEN ${videos.status} = 'draft' THEN 2
        ELSE 3
      END, ${videos.sort} DESC, ${videos.createdAt} DESC`)
      .limit(limit)
      .offset(offset)

    // 获取总数
    const totalQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(videos)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)

    return NextResponse.json({
      success: true,
      data: videoList,
      total: totalQuery[0].count,
      page,
      limit,
    })
  } catch (error) {
    console.error('Failed to fetch videos:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch videos',
    }, { status: 500 })
  }
}

// 创建视频
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, url, duration, filename, filesize, filetype, status, views, sort } = body

    const newVideo = await db.insert(videos).values({
      title,
      description,
      url,
      duration,
      filename,
      filesize,
      filetype,
      status,
      views,
      sort,
    }).returning()

    return NextResponse.json(newVideo[0])
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 })
  }
}

// 更新视频
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, description, url, duration, filename, filesize, filetype, status, views, sort } = body

    const updatedVideo = await db
      .update(videos)
      .set({
        title,
        description,
        url,
        duration,
        filename,
        filesize,
        filetype,
        status,
        views,
        sort,
        updatedAt: new Date(),
      })
      .where(eq(videos.id, id))
      .returning()

    return NextResponse.json(updatedVideo[0])
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 })
  }
}

// 删除视频
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    await db.delete(videos).where(eq(videos.id, parseInt(id)))

    return NextResponse.json({ message: 'Video deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}
