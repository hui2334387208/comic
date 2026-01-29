'use server'

import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { coupletContents } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

async function parseIds(params: Promise<{ id: string; versionId: string; contentId: string }>) {
  const { id, versionId, contentId } = await params
  const coupletId = parseInt(id)
  const parsedVersionId = parseInt(versionId)
  const parsedContentId = parseInt(contentId)
  
  if (isNaN(coupletId) || isNaN(parsedVersionId) || isNaN(parsedContentId)) {
    throw new Error('Invalid ID')
  }
  
  return { coupletId, versionId: parsedVersionId, contentId: parsedContentId }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; contentId: string }> },
) {
  const permissionCheck = await requirePermission('couplet-content.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { coupletId, versionId, contentId } = await parseIds(params)

    const [content] = await db
      .select()
      .from(coupletContents)
      .where(
        and(
          eq(coupletContents.coupletId, coupletId),
          eq(coupletContents.versionId, versionId),
          eq(coupletContents.id, contentId)
        )
      )
      .limit(1)

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: content,
    })
  } catch (error) {
    console.error('Error fetching couplet content:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch couplet content',
      },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; contentId: string }> },
) {
  const permissionCheck = await requirePermission('couplet-content.update')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { coupletId, versionId, contentId } = await parseIds(params)
    const body = await request.json()

    const [updated] = await db
      .update(coupletContents)
      .set({
        upperLine: body.upperLine || '',
        lowerLine: body.lowerLine || '',
        horizontalScroll: body.horizontalScroll || '',
        appreciation: body.appreciation || '',
        orderIndex: body.orderIndex || 0,
      })
      .where(
        and(
          eq(coupletContents.coupletId, coupletId),
          eq(coupletContents.versionId, versionId),
          eq(coupletContents.id, contentId)
        )
      )
      .returning()

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'couplet-content',
      action: 'update',
      description: `Content updated: ${contentId} for version ${versionId}`,
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('Error updating couplet content:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update couplet content',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; contentId: string }> },
) {
  const permissionCheck = await requirePermission('couplet-content.delete')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { coupletId, versionId, contentId } = await parseIds(params)

    const [deleted] = await db
      .delete(coupletContents)
      .where(
        and(
          eq(coupletContents.coupletId, coupletId),
          eq(coupletContents.versionId, versionId),
          eq(coupletContents.id, contentId)
        )
      )
      .returning({ id: coupletContents.id })

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'couplet-content',
      action: 'delete',
      description: `Content deleted: ${contentId} for version ${versionId}`,
    })

    return NextResponse.json({
      success: true,
      data: deleted,
    })
  } catch (error) {
    console.error('Error deleting couplet content:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete couplet content',
      },
      { status: 500 },
    )
  }
}