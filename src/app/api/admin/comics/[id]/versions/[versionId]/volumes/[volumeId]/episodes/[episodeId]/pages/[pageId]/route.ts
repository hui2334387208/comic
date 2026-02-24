'use server'

import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { comicPages } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; volumeId: string; episodeId: string; pageId: string }> },
) {
  const permissionCheck = await requirePermission('comic-page.read')(request)
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

    const [page] = await db
      .select()
      .from(comicPages)
      .where(eq(comicPages.id, pageIdNum))
      .limit(1)

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: page,
    })
  } catch (error) {
    logger.error({
      module: 'comic-pages',
      action: 'fetch',
      description: `Error fetching page: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch page',
      },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; volumeId: string; episodeId: string; pageId: string }> },
) {
  const permissionCheck = await requirePermission('comic-page.update')(request)
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

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (body.pageNumber !== undefined) updateData.pageNumber = body.pageNumber
    if (body.pageLayout !== undefined) updateData.pageLayout = body.pageLayout
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl
    if (body.status !== undefined) updateData.status = body.status

    const [updatedPage] = await db
      .update(comicPages)
      .set(updateData)
      .where(eq(comicPages.id, pageIdNum))
      .returning()

    if (!updatedPage) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'comic-pages',
      action: 'update',
      description: `Page updated: Page ${updatedPage.pageNumber} (ID: ${updatedPage.id})`,
    })

    return NextResponse.json({
      success: true,
      data: updatedPage,
    })
  } catch (error) {
    logger.error({
      module: 'comic-pages',
      action: 'update',
      description: `Error updating page: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update page',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; volumeId: string; episodeId: string; pageId: string }> },
) {
  const permissionCheck = await requirePermission('comic-page.delete')(request)
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

    const [deletedPage] = await db
      .delete(comicPages)
      .where(eq(comicPages.id, pageIdNum))
      .returning()

    if (!deletedPage) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'comic-pages',
      action: 'delete',
      description: `Page deleted: Page ${deletedPage.pageNumber} (ID: ${deletedPage.id})`,
    })

    return NextResponse.json({
      success: true,
      data: deletedPage,
    })
  } catch (error) {
    logger.error({
      module: 'comic-pages',
      action: 'delete',
      description: `Error deleting page: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete page',
      },
      { status: 500 },
    )
  }
}
