'use server'

import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { comicVersions } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const permissionCheck = await requirePermission('comic-version.read')(request)
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

    const [version] = await db
      .select()
      .from(comicVersions)
      .where(eq(comicVersions.id, versionIdNum))
      .limit(1)

    if (!version) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: version,
    })
  } catch (error) {
    logger.error({
      module: 'comic-versions',
      action: 'fetch',
      description: `Error fetching version: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch version',
      },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const permissionCheck = await requirePermission('comic-version.update')(request)
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

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (body.version !== undefined) updateData.version = body.version
    if (body.versionDescription !== undefined) updateData.versionDescription = body.versionDescription
    if (body.parentVersionId !== undefined) updateData.parentVersionId = body.parentVersionId
    if (body.isLatestVersion !== undefined) {
      updateData.isLatestVersion = body.isLatestVersion
      // If setting as latest, unset others
      if (body.isLatestVersion) {
        await db
          .update(comicVersions)
          .set({ isLatestVersion: false })
          .where(eq(comicVersions.comicId, comicId))
      }
    }

    const [updatedVersion] = await db
      .update(comicVersions)
      .set(updateData)
      .where(eq(comicVersions.id, versionIdNum))
      .returning()

    if (!updatedVersion) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'comic-versions',
      action: 'update',
      description: `Version updated: Version ${updatedVersion.version} (ID: ${updatedVersion.id})`,
    })

    return NextResponse.json({
      success: true,
      data: updatedVersion,
    })
  } catch (error) {
    logger.error({
      module: 'comic-versions',
      action: 'update',
      description: `Error updating version: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update version',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const permissionCheck = await requirePermission('comic-version.delete')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { id, versionId } = await params
    const versionIdNum = parseInt(versionId)

    if (isNaN(versionIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid version ID' },
        { status: 400 },
      )
    }

    const [deletedVersion] = await db
      .delete(comicVersions)
      .where(eq(comicVersions.id, versionIdNum))
      .returning()

    if (!deletedVersion) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'comic-versions',
      action: 'delete',
      description: `Version deleted: Version ${deletedVersion.version} (ID: ${deletedVersion.id})`,
    })

    return NextResponse.json({
      success: true,
      data: deletedVersion,
    })
  } catch (error) {
    logger.error({
      module: 'comic-versions',
      action: 'delete',
      description: `Error deleting version: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete version',
      },
      { status: 500 },
    )
  }
}
