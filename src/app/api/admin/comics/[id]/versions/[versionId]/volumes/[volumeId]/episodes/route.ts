'use server'

import { NextRequest, NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'

import { db } from '@/db'
import { comicEpisodes } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; volumeId: string }> },
) {
  const permissionCheck = await requirePermission('comic-episode.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { volumeId } = await params
    const volumeIdNum = parseInt(volumeId)

    if (isNaN(volumeIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid volume ID' },
        { status: 400 },
      )
    }

    const items = await db
      .select()
      .from(comicEpisodes)
      .where(eq(comicEpisodes.volumeId, volumeIdNum))
      .orderBy(asc(comicEpisodes.episodeNumber))

    return NextResponse.json({
      success: true,
      data: {
        items,
      },
    })
  } catch (error) {
    logger.error({
      module: 'comic-episodes',
      action: 'fetch',
      description: `Error fetching episodes: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch episodes',
      },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; volumeId: string }> },
) {
  const permissionCheck = await requirePermission('comic-episode.create')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { id, versionId, volumeId } = await params
    const comicId = parseInt(id)
    const versionIdNum = parseInt(versionId)
    const volumeIdNum = parseInt(volumeId)

    if (isNaN(comicId) || isNaN(versionIdNum) || isNaN(volumeIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 },
      )
    }

    const body = await request.json()

    if (!body.episodeNumber || !body.title) {
      return NextResponse.json(
        { success: false, error: 'Episode number and title are required' },
        { status: 400 },
      )
    }

    const [episode] = await db
      .insert(comicEpisodes)
      .values({
        comicId,
        versionId: versionIdNum,
        volumeId: volumeIdNum,
        episodeNumber: body.episodeNumber,
        title: body.title,
        description: body.description || null,
        pageCount: body.pageCount || 0,
        status: body.status || 'draft',
      })
      .returning()

    logger.info({
      module: 'comic-episodes',
      action: 'create',
      description: `Episode created: ${episode.title} (ID: ${episode.id})`,
    })

    return NextResponse.json({
      success: true,
      data: episode,
    })
  } catch (error) {
    logger.error({
      module: 'comic-episodes',
      action: 'create',
      description: `Error creating episode: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create episode',
      },
      { status: 500 },
    )
  }
}
