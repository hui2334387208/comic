import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { videos } from '@/db/schema/video'
import { authOptions } from '@/lib/authOptions'
import { logger } from '@/lib/logger'

// 获取单个视频
export async function GET(
  request: Request,
  context: { params: Promise<{ id: number }> },
) {
  try {
    const { id } = await context.params
    const video = await db
      .select()
      .from(videos)
      .where(eq(videos.id, id))
      .limit(1)

    if (!video.length) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json(video[0])
  } catch (error) {
    console.error('Failed to fetch video:', error)
    await logger.error({
      module: 'admin',
      action: 'get_video',
      description: `Failed to fetch video: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 })
  }
}

// 更新视频
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: number }> },
) {
  let session: any = undefined
  try {
    session = await getServerSession(authOptions)
    if (!session?.user) {
      await logger.error({
        module: 'admin',
        action: 'update_video',
        description: 'Unauthorized attempt to update video',
        userId: session?.user?.id,
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, url, duration, status, sort } = body

    const { id } = await context.params
    const updatedVideo = await db
      .update(videos)
      .set({
        title,
        description,
        url,
        duration,
        status,
        sort,
        updatedAt: new Date(),
      })
      .where(eq(videos.id, id))
      .returning()

    if (!updatedVideo.length) {
      await logger.error({
         module: 'admin',
         action: 'update_video',
         description: `Video with ID ${id} not found for update.`,
         userId: session.user.id,
      })
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    await logger.info({
      module: 'admin',
      action: 'update_video',
      description: `Video updated successfully: ${updatedVideo[0].url || id}`,
      userId: session.user.id,
    })

    return NextResponse.json(updatedVideo[0])
  } catch (error) {
    console.error('Failed to update video:', error)
    await logger.error({
      module: 'admin',
      action: 'update_video',
      description: `Failed to update video: ${error instanceof Error ? error.message : 'Unknown error'}`,
      userId: session?.user?.id,
    })
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 })
  }
}

// 删除视频
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: number }> },
) {
  let session: any = undefined
  try {
    session = await getServerSession(authOptions)
    if (!session?.user) {
      await logger.error({
        module: 'admin',
        action: 'delete_video',
        description: 'Unauthorized attempt to delete video',
        userId: session?.user?.id,
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const videoToDelete = await db.query.videos.findFirst({
      where: eq(videos.id, id),
    })

    if (!videoToDelete) {
       await logger.error({
         module: 'admin',
         action: 'delete_video',
         description: `Video with ID ${id} not found for deletion.`,
         userId: session.user.id,
      })
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    if (videoToDelete.url) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      const deleteRes = await fetch(new URL('/api/admin/upload/batch', baseUrl), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
        },
        body: JSON.stringify({ urls: [videoToDelete.url] }),
      })

      if (!deleteRes.ok) {
        const errorResponse = await deleteRes.json()
        const errorMessage = errorResponse.error || 'Failed to delete video blob resource'
         await logger.error({
           module: 'admin',
           action: 'delete_video',
           description: `Failed to delete video blob for ID ${id}: ${errorMessage}`,
           userId: session.user.id,
         })
        throw new Error(errorMessage)
      }
       await logger.info({
         module: 'admin',
         action: 'delete_video',
         description: `Successfully deleted video blob for ID ${id}: ${videoToDelete.url}`,
         userId: session.user.id,
       })
    }

    const deletedVideo = await db
      .delete(videos)
      .where(eq(videos.id, id))
      .returning()

    if (!deletedVideo.length) {
       console.warn(`Database delete returned no rows for video ID ${id}, but resource was found.`)
         await logger.error({
           module: 'admin',
           action: 'delete_video',
           description: `Database delete returned no rows for video ID ${id}, but resource was found.`,
           userId: session.user.id,
         })
    }

    await logger.info({
      module: 'admin',
      action: 'delete_video',
      description: `Video database record deleted successfully for ID ${id}`,
      userId: session.user.id,
    })

    return NextResponse.json({ message: 'Video deleted successfully' })
  } catch (error) {
    console.error('删除视频失败:', error)
    await logger.error({
      module: 'admin',
      action: 'delete_video',
      description: `Failed to delete video (database record or blob): ${error instanceof Error ? error.message : 'Unknown error'}`,
      userId: session?.user?.id,
    })
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}
