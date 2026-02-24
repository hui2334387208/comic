'use server'

import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { comicVolumes } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; volumeId: string }> },
) {
  const permissionCheck = await requirePermission('comic-volume.read')(request)
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

    const [volume] = await db
      .select()
      .from(comicVolumes)
      .where(eq(comicVolumes.id, volumeIdNum))
      .limit(1)

    if (!volume) {
      return NextResponse.json(
        { success: false, error: 'Volume not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: volume,
    })
  } catch (error) {
    logger.error({
      module: 'comic-volumes',
      action: 'fetch',
      description: `Error fetching volume: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch volume',
      },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; volumeId: string }> },
) {
  const permissionCheck = await requirePermission('comic-volume.update')(request)
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

    const body = await request.json()

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (body.volumeNumber !== undefined) updateData.volumeNumber = body.volumeNumber
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage
    if (body.startEpisode !== undefined) updateData.startEpisode = body.startEpisode
    if (body.endEpisode !== undefined) updateData.endEpisode = body.endEpisode
    if (body.status !== undefined) updateData.status = body.status

    const [updatedVolume] = await db
      .update(comicVolumes)
      .set(updateData)
      .where(eq(comicVolumes.id, volumeIdNum))
      .returning()

    if (!updatedVolume) {
      return NextResponse.json(
        { success: false, error: 'Volume not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'comic-volumes',
      action: 'update',
      description: `Volume updated: ${updatedVolume.title} (ID: ${updatedVolume.id})`,
    })

    return NextResponse.json({
      success: true,
      data: updatedVolume,
    })
  } catch (error) {
    logger.error({
      module: 'comic-volumes',
      action: 'update',
      description: `Error updating volume: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update volume',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; volumeId: string }> },
) {
  const permissionCheck = await requirePermission('comic-volume.delete')(request)
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

    const [deletedVolume] = await db
      .delete(comicVolumes)
      .where(eq(comicVolumes.id, volumeIdNum))
      .returning()

    if (!deletedVolume) {
      return NextResponse.json(
        { success: false, error: 'Volume not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'comic-volumes',
      action: 'delete',
      description: `Volume deleted: ${deletedVolume.title} (ID: ${deletedVolume.id})`,
    })

    return NextResponse.json({
      success: true,
      data: deletedVolume,
    })
  } catch (error) {
    logger.error({
      module: 'comic-volumes',
      action: 'delete',
      description: `Error deleting volume: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete volume',
      },
      { status: 500 },
    )
  }
}
