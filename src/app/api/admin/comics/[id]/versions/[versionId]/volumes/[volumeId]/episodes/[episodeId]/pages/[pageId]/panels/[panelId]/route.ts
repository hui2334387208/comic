'use server'

import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { comicPanels } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; volumeId: string; episodeId: string; pageId: string; panelId: string }> },
) {
  const permissionCheck = await requirePermission('comic-panel.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { panelId } = await params
    const panelIdNum = parseInt(panelId)

    if (isNaN(panelIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid panel ID' },
        { status: 400 },
      )
    }

    const [panel] = await db
      .select()
      .from(comicPanels)
      .where(eq(comicPanels.id, panelIdNum))
      .limit(1)

    if (!panel) {
      return NextResponse.json(
        { success: false, error: 'Panel not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: panel,
    })
  } catch (error) {
    logger.error({
      module: 'comic-panels',
      action: 'fetch',
      description: `Error fetching panel: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch panel',
      },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; volumeId: string; episodeId: string; pageId: string; panelId: string }> },
) {
  const permissionCheck = await requirePermission('comic-panel.update')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { panelId } = await params
    const panelIdNum = parseInt(panelId)

    if (isNaN(panelIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid panel ID' },
        { status: 400 },
      )
    }

    const body = await request.json()

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (body.panelNumber !== undefined) updateData.panelNumber = body.panelNumber
    if (body.sceneDescription !== undefined) updateData.sceneDescription = body.sceneDescription
    if (body.dialogue !== undefined) updateData.dialogue = body.dialogue
    if (body.narration !== undefined) updateData.narration = body.narration
    if (body.emotion !== undefined) updateData.emotion = body.emotion
    if (body.cameraAngle !== undefined) updateData.cameraAngle = body.cameraAngle
    if (body.characters !== undefined) updateData.characters = body.characters

    const [updatedPanel] = await db
      .update(comicPanels)
      .set(updateData)
      .where(eq(comicPanels.id, panelIdNum))
      .returning()

    if (!updatedPanel) {
      return NextResponse.json(
        { success: false, error: 'Panel not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'comic-panels',
      action: 'update',
      description: `Panel updated: Panel ${updatedPanel.panelNumber} (ID: ${updatedPanel.id})`,
    })

    return NextResponse.json({
      success: true,
      data: updatedPanel,
    })
  } catch (error) {
    logger.error({
      module: 'comic-panels',
      action: 'update',
      description: `Error updating panel: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update panel',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; volumeId: string; episodeId: string; pageId: string; panelId: string }> },
) {
  const permissionCheck = await requirePermission('comic-panel.delete')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { panelId } = await params
    const panelIdNum = parseInt(panelId)

    if (isNaN(panelIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid panel ID' },
        { status: 400 },
      )
    }

    const [deletedPanel] = await db
      .delete(comicPanels)
      .where(eq(comicPanels.id, panelIdNum))
      .returning()

    if (!deletedPanel) {
      return NextResponse.json(
        { success: false, error: 'Panel not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'comic-panels',
      action: 'delete',
      description: `Panel deleted: Panel ${deletedPanel.panelNumber} (ID: ${deletedPanel.id})`,
    })

    return NextResponse.json({
      success: true,
      data: deletedPanel,
    })
  } catch (error) {
    logger.error({
      module: 'comic-panels',
      action: 'delete',
      description: `Error deleting panel: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete panel',
      },
      { status: 500 },
    )
  }
}
