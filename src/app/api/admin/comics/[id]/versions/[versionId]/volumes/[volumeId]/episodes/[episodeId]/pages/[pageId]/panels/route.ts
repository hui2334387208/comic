'use server'

import { NextRequest, NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'

import { db } from '@/db'
import { comicPanels } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; volumeId: string; episodeId: string; pageId: string }> },
) {
  const permissionCheck = await requirePermission('comic-panel.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { pageId } = await params
    const pageIdNum = parseInt(pageId)

    if (isNaN(pageIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid page ID' },
        { status: 400 },
      )
    }

    const items = await db
      .select()
      .from(comicPanels)
      .where(eq(comicPanels.pageId, pageIdNum))
      .orderBy(asc(comicPanels.panelNumber))

    return NextResponse.json({
      success: true,
      data: {
        items,
      },
    })
  } catch (error) {
    logger.error({
      module: 'comic-panels',
      action: 'fetch',
      description: `Error fetching panels: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch panels',
      },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; volumeId: string; episodeId: string; pageId: string }> },
) {
  const permissionCheck = await requirePermission('comic-panel.create')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { pageId } = await params
    const pageIdNum = parseInt(pageId)

    if (isNaN(pageIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid page ID' },
        { status: 400 },
      )
    }

    const body = await request.json()

    if (!body.panelNumber) {
      return NextResponse.json(
        { success: false, error: 'Panel number is required' },
        { status: 400 },
      )
    }

    const [panel] = await db
      .insert(comicPanels)
      .values({
        pageId: pageIdNum,
        panelNumber: body.panelNumber,
        sceneDescription: body.sceneDescription || null,
        dialogue: body.dialogue || null,
        narration: body.narration || null,
        emotion: body.emotion || null,
        cameraAngle: body.cameraAngle || null,
        characters: body.characters || null,
      })
      .returning()

    logger.info({
      module: 'comic-panels',
      action: 'create',
      description: `Panel created: Panel ${panel.panelNumber} (ID: ${panel.id})`,
    })

    return NextResponse.json({
      success: true,
      data: panel,
    })
  } catch (error) {
    logger.error({
      module: 'comic-panels',
      action: 'create',
      description: `Error creating panel: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create panel',
      },
      { status: 500 },
    )
  }
}
