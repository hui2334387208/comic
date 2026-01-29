'use server'

import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, sql } from 'drizzle-orm'

import { db } from '@/db'
import { couplets, coupletVersions, coupletContents } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

async function parseId(params: Promise<{ id: string }>) {
  const { id } = await params
  const parsedId = parseInt(id)
  if (isNaN(parsedId)) {
    throw new Error('Invalid ID')
  }
  return parsedId
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('couplet-version.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const coupletId = await parseId(params)

    // First check if couplet exists
    const [couplet] = await db
      .select({ id: couplets.id })
      .from(couplets)
      .where(eq(couplets.id, coupletId))
      .limit(1)

    if (!couplet) {
      return NextResponse.json(
        { success: false, error: 'Couplet not found' },
        { status: 404 },
      )
    }

    // Get all versions for this couplet
    const versions = await db
      .select({
        id: coupletVersions.id,
        coupletId: coupletVersions.coupletId,
        version: coupletVersions.version,
        parentVersionId: coupletVersions.parentVersionId,
        versionDescription: coupletVersions.versionDescription,
        isLatestVersion: coupletVersions.isLatestVersion,
        originalCoupletId: coupletVersions.originalCoupletId,
        createdAt: coupletVersions.createdAt,
        updatedAt: coupletVersions.updatedAt,
      })
      .from(coupletVersions)
      .where(eq(coupletVersions.coupletId, coupletId))
      .orderBy(desc(coupletVersions.version))

    // Get content count for each version
    const contentCounts = await db
      .select({
        versionId: coupletContents.versionId,
        count: sql<number>`count(*)`,
      })
      .from(coupletContents)
      .where(eq(coupletContents.coupletId, coupletId))
      .groupBy(coupletContents.versionId)

    const contentCountMap = new Map(
      contentCounts.map(item => [item.versionId, Number(item.count)])
    )

    const formattedVersions = versions.map(version => ({
      ...version,
      contentCount: contentCountMap.get(version.id) || 0,
    }))

    return NextResponse.json({
      success: true,
      data: {
        items: formattedVersions,
        total: formattedVersions.length,
      },
    })
  } catch (error) {
    logger.error({
      module: 'couplet-versions',
      action: 'fetch',
      description: `Error fetching couplet versions: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch couplet versions',
      },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('couplet-version.create')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const coupletId = await parseId(params)
    const body = await request.json()

    // First check if couplet exists
    const [couplet] = await db
      .select({ id: couplets.id })
      .from(couplets)
      .where(eq(couplets.id, coupletId))
      .limit(1)

    if (!couplet) {
      return NextResponse.json(
        { success: false, error: 'Couplet not found' },
        { status: 404 },
      )
    }

    // Get the next version number
    const [latestVersion] = await db
      .select({ version: coupletVersions.version })
      .from(coupletVersions)
      .where(eq(coupletVersions.coupletId, coupletId))
      .orderBy(desc(coupletVersions.version))
      .limit(1)

    const nextVersion = (latestVersion?.version || 0) + 1

    // If this is set as the latest version, update all other versions
    if (body.isLatestVersion) {
      await db
        .update(coupletVersions)
        .set({ isLatestVersion: false })
        .where(eq(coupletVersions.coupletId, coupletId))
    }

    const [version] = await db
      .insert(coupletVersions)
      .values({
        coupletId,
        version: nextVersion,
        parentVersionId: body.parentVersionId || null,
        versionDescription: body.versionDescription || '',
        isLatestVersion: body.isLatestVersion ?? false,
        originalCoupletId: body.originalCoupletId || null,
      })
      .returning()

    logger.info({
      module: 'couplet-versions',
      action: 'create',
      description: `Couplet version created: v${nextVersion} for couplet ${coupletId} (Version ID: ${version.id})`,
    })

    return NextResponse.json({
      success: true,
      data: version,
    })
  } catch (error) {
    logger.error({
      module: 'couplet-versions',
      action: 'create',
      description: `Error creating couplet version: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create couplet version',
      },
      { status: 500 },
    )
  }
}