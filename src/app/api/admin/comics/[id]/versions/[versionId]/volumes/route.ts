'use server'

import { NextRequest, NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'

import { db } from '@/db'
import { comicVolumes } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const permissionCheck = await requirePermission('comic-volume.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { id, versionId } = await params
    const comicId = parseInt(id)
    const versionIdNum = parseInt(versionId)

    if (isNaN(comicId) || isNaN(versionIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 },
      )
    }

    const items = await db
      .select()
      .from(comicVolumes)
      .where(eq(comicVolumes.versionId, versionIdNum))
      .orderBy(asc(comicVolumes.volumeNumber))

    return NextResponse.json({
      success: true,
      data: {
        items,
      },
    })
  } catch (error) {
    logger.error({
      module: 'comic-volumes',
      action: 'fetch',
      description: `Error fetching volumes: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch volumes',
      },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const permissionCheck = await requirePermission('comic-volume.create')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { id, versionId } = await params
    const comicId = parseInt(id)
    const versionIdNum = parseInt(versionId)

    if (isNaN(comicId) || isNaN(versionIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 },
      )
    }

    const body = await request.json()

    if (!body.volumeNumber || !body.title) {
      return NextResponse.json(
        { success: false, error: 'Volume number and title are required' },
        { status: 400 },
      )
    }

    const [volume] = await db
      .insert(comicVolumes)
      .values({
        comicId,
        versionId: versionIdNum,
        volumeNumber: body.volumeNumber,
        title: body.title,
        description: body.description || null,
        coverImage: body.coverImage || null,
        episodeCount: body.episodeCount || 0,
        startEpisode: body.startEpisode || null,
        endEpisode: body.endEpisode || null,
        status: body.status || 'draft',
      })
      .returning()

    logger.info({
      module: 'comic-volumes',
      action: 'create',
      description: `Volume created: ${volume.title} (ID: ${volume.id})`,
    })

    return NextResponse.json({
      success: true,
      data: volume,
    })
  } catch (error) {
    logger.error({
      module: 'comic-volumes',
      action: 'create',
      description: `Error creating volume: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create volume',
      },
      { status: 500 },
    )
  }
}
