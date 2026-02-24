'use server'

import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { comicEpisodes } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; volumeId: string; episodeId: string }> },
) {
  const permissionCheck = await requirePermission('comic-episode.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { episodeId } = await params
    const episodeIdNum = parseInt(episodeId)

    if (isNaN(episodeIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid episode ID' },
        { status: 400 },
      )
    }

    const [episode] = await db
      .select()
      .from(comicEpisodes)
      .where(eq(comicEpisodes.id, episodeIdNum))
      .limit(1)

    if (!episode) {
      return NextResponse.json(
        { success: false, error: 'Episode not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: episode,
    })
  } catch (error) {
    logger.error({
      module: 'comic-episodes',
      action: 'fetch',
      description: `Error fetching episode: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch episode',
      },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; volumeId: string; episodeId: string }> },
) {
  const permissionCheck = await requirePermission('comic-episode.update')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { episodeId } = await params
    const episodeIdNum = parseInt(episodeId)

    if (isNaN(episodeIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid episode ID' },
        { status: 400 },
      )
    }

    const body = await request.json()

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (body.episodeNumber !== undefined) updateData.episodeNumber = body.episodeNumber
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status

    const [updatedEpisode] = await db
      .update(comicEpisodes)
      .set(updateData)
      .where(eq(comicEpisodes.id, episodeIdNum))
      .returning()

    if (!updatedEpisode) {
      return NextResponse.json(
        { success: false, error: 'Episode not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'comic-episodes',
      action: 'update',
      description: `Episode updated: ${updatedEpisode.title} (ID: ${updatedEpisode.id})`,
    })

    return NextResponse.json({
      success: true,
      data: updatedEpisode,
    })
  } catch (error) {
    logger.error({
      module: 'comic-episodes',
      action: 'update',
      description: `Error updating episode: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update episode',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; volumeId: string; episodeId: string }> },
) {
  const permissionCheck = await requirePermission('comic-episode.delete')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { episodeId } = await params
    const episodeIdNum = parseInt(episodeId)

    if (isNaN(episodeIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid episode ID' },
        { status: 400 },
      )
    }

    const [deletedEpisode] = await db
      .delete(comicEpisodes)
      .where(eq(comicEpisodes.id, episodeIdNum))
      .returning()

    if (!deletedEpisode) {
      return NextResponse.json(
        { success: false, error: 'Episode not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'comic-episodes',
      action: 'delete',
      description: `Episode deleted: ${deletedEpisode.title} (ID: ${deletedEpisode.id})`,
    })

    return NextResponse.json({
      success: true,
      data: deletedEpisode,
    })
  } catch (error) {
    logger.error({
      module: 'comic-episodes',
      action: 'delete',
      description: `Error deleting episode: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete episode',
      },
      { status: 500 },
    )
  }
}
