'use server'

import { NextRequest, NextResponse } from 'next/server'
import { desc, eq, sql } from 'drizzle-orm'

import { db } from '@/db'
import { comicVersions } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('comic-version.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { id } = await params
    const comicId = parseInt(id)

    if (isNaN(comicId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid comic ID' },
        { status: 400 },
      )
    }

    const items = await db
      .select()
      .from(comicVersions)
      .where(eq(comicVersions.comicId, comicId))
      .orderBy(desc(comicVersions.version))

    return NextResponse.json({
      success: true,
      data: {
        items,
      },
    })
  } catch (error) {
    logger.error({
      module: 'comic-versions',
      action: 'fetch',
      description: `Error fetching versions: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch versions',
      },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('comic-version.create')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { id } = await params
    const comicId = parseInt(id)

    if (isNaN(comicId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid comic ID' },
        { status: 400 },
      )
    }

    const body = await request.json()

    if (!body.version) {
      return NextResponse.json(
        { success: false, error: 'Version number is required' },
        { status: 400 },
      )
    }

    // If this is set as latest version, unset other latest versions
    if (body.isLatestVersion) {
      await db
        .update(comicVersions)
        .set({ isLatestVersion: false })
        .where(eq(comicVersions.comicId, comicId))
    }

    const [version] = await db
      .insert(comicVersions)
      .values({
        comicId,
        version: body.version,
        versionDescription: body.versionDescription || null,
        parentVersionId: body.parentVersionId || null,
        isLatestVersion: body.isLatestVersion ?? true,
      })
      .returning()

    logger.info({
      module: 'comic-versions',
      action: 'create',
      description: `Version created for comic ${comicId}: Version ${version.version} (ID: ${version.id})`,
    })

    return NextResponse.json({
      success: true,
      data: version,
    })
  } catch (error) {
    logger.error({
      module: 'comic-versions',
      action: 'create',
      description: `Error creating version: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create version',
      },
      { status: 500 },
    )
  }
}
