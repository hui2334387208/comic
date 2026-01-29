'use server'

import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { couplets, coupletVersions } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

async function parseIds(params: Promise<{ id: string; versionId: string }>) {
  const { id, versionId } = await params
  const coupletId = parseInt(id)
  const parsedVersionId = parseInt(versionId)
  
  if (isNaN(coupletId) || isNaN(parsedVersionId)) {
    throw new Error('Invalid ID')
  }
  
  return { coupletId, versionId: parsedVersionId }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const permissionCheck = await requirePermission('couplet-version.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { coupletId, versionId } = await parseIds(params)

    // Get couplet and version data
    const [result] = await db
      .select({
        couplet: {
          id: couplets.id,
          title: couplets.title,
          slug: couplets.slug,
          description: couplets.description,
          status: couplets.status,
          createdAt: couplets.createdAt,
        },
        version: {
          id: coupletVersions.id,
          coupletId: coupletVersions.coupletId,
          version: coupletVersions.version,
          parentVersionId: coupletVersions.parentVersionId,
          versionDescription: coupletVersions.versionDescription,
          isLatestVersion: coupletVersions.isLatestVersion,
          originalCoupletId: coupletVersions.originalCoupletId,
          createdAt: coupletVersions.createdAt,
          updatedAt: coupletVersions.updatedAt,
        },
      })
      .from(couplets)
      .innerJoin(coupletVersions, eq(couplets.id, coupletVersions.coupletId))
      .where(
        and(
          eq(couplets.id, coupletId),
          eq(coupletVersions.id, versionId)
        )
      )
      .limit(1)

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Couplet or version not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error fetching couplet version:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch couplet version',
      },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const permissionCheck = await requirePermission('couplet-version.update')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { coupletId, versionId } = await parseIds(params)
    const body = await request.json()

    // If setting as latest version, update all other versions first
    if (body.isLatestVersion) {
      await db
        .update(coupletVersions)
        .set({ isLatestVersion: false })
        .where(eq(coupletVersions.coupletId, coupletId))
    }

    const [updated] = await db
      .update(coupletVersions)
      .set({
        versionDescription: body.versionDescription,
        isLatestVersion: body.isLatestVersion ?? false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(coupletVersions.coupletId, coupletId),
          eq(coupletVersions.id, versionId)
        )
      )
      .returning()

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'couplet-version',
      action: 'update',
      description: `Version updated for couplet ${coupletId}`,
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('Error updating couplet version:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update couplet version',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const permissionCheck = await requirePermission('couplet-version.delete')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { coupletId, versionId } = await parseIds(params)

    // Check if this is the latest version
    const [version] = await db
      .select({ isLatestVersion: coupletVersions.isLatestVersion })
      .from(coupletVersions)
      .where(
        and(
          eq(coupletVersions.coupletId, coupletId),
          eq(coupletVersions.id, versionId)
        )
      )
      .limit(1)

    if (!version) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 },
      )
    }

    if (version.isLatestVersion) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the latest version' },
        { status: 400 },
      )
    }

    const [deleted] = await db
      .delete(coupletVersions)
      .where(
        and(
          eq(coupletVersions.coupletId, coupletId),
          eq(coupletVersions.id, versionId)
        )
      )
      .returning({ id: coupletVersions.id, version: coupletVersions.version })

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'couplet-version',
      action: 'delete',
      description: `Version deleted for couplet ${coupletId}`,
    })

    return NextResponse.json({
      success: true,
      data: deleted,
    })
  } catch (error) {
    console.error('Error deleting couplet version:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete couplet version',
      },
      { status: 500 },
    )
  }
}