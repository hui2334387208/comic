'use server'

import { NextRequest, NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'

import { db } from '@/db'
import { comicPages } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; volumeId: string; episodeId: string }> },
) {
  const permissionCheck = await requirePermission('comic-page.read')(request)
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

    const items = await db
      .select()
      .from(comicPages)
      .where(eq(comicPages.episodeId, episodeIdNum))
      .orderBy(asc(comicPages.pageNumber))

    return NextResponse.json({
      success: true,
      data: {
        items,
      },
    })
  } catch (error) {
    logger.error({
      module: 'comic-pages',
      action: 'fetch',
      description: `Error fetching pages: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pages',
      },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; volumeId: string; episodeId: string }> },
) {
  const permissionCheck = await requirePermission('comic-page.create')(request)
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

    if (!body.pageNumber) {
      return NextResponse.json(
        { success: false, error: 'Page number is required' },
        { status: 400 },
      )
    }

    const [page] = await db
      .insert(comicPages)
      .values({
        episodeId: episodeIdNum,
        pageNumber: body.pageNumber,
        pageLayout: body.pageLayout || null,
        panelCount: body.panelCount || 0,
        imageUrl: body.imageUrl || null,
        status: body.status || 'draft',
      })
      .returning()

    logger.info({
      module: 'comic-pages',
      action: 'create',
      description: `Page created: Page ${page.pageNumber} (ID: ${page.id})`,
    })

    return NextResponse.json({
      success: true,
      data: page,
    })
  } catch (error) {
    logger.error({
      module: 'comic-pages',
      action: 'create',
      description: `Error creating page: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create page',
      },
      { status: 500 },
    )
  }
}
