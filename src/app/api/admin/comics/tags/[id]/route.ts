'use server'

import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { comicTags } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('comic-tag.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { id } = await params
    const tagId = parseInt(id)

    if (isNaN(tagId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tag ID' },
        { status: 400 },
      )
    }

    const [tag] = await db
      .select()
      .from(comicTags)
      .where(eq(comicTags.id, tagId))
      .limit(1)

    if (!tag) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: tag,
    })
  } catch (error) {
    logger.error({
      module: 'comic-tags',
      action: 'fetch',
      description: `Error fetching tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tag',
      },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('comic-tag.update')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { id } = await params
    const tagId = parseInt(id)

    if (isNaN(tagId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tag ID' },
        { status: 400 },
      )
    }

    const body = await request.json()

    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.color !== undefined) updateData.color = body.color
    if (body.status !== undefined) updateData.status = body.status

    const [updatedTag] = await db
      .update(comicTags)
      .set(updateData)
      .where(eq(comicTags.id, tagId))
      .returning()

    if (!updatedTag) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'comic-tags',
      action: 'update',
      description: `Tag updated: ${updatedTag.name} (ID: ${updatedTag.id})`,
    })

    return NextResponse.json({
      success: true,
      data: updatedTag,
    })
  } catch (error) {
    logger.error({
      module: 'comic-tags',
      action: 'update',
      description: `Error updating tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update tag',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('comic-tag.delete')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { id } = await params
    const tagId = parseInt(id)

    if (isNaN(tagId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tag ID' },
        { status: 400 },
      )
    }

    const [deletedTag] = await db
      .delete(comicTags)
      .where(eq(comicTags.id, tagId))
      .returning()

    if (!deletedTag) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'comic-tags',
      action: 'delete',
      description: `Tag deleted: ${deletedTag.name} (ID: ${deletedTag.id})`,
    })

    return NextResponse.json({
      success: true,
      data: deletedTag,
    })
  } catch (error) {
    logger.error({
      module: 'comic-tags',
      action: 'delete',
      description: `Error deleting tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete tag',
      },
      { status: 500 },
    )
  }
}
