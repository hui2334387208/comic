'use server'

import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { coupletVersions, coupletContents } from '@/db/schema'
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
  const permissionCheck = await requirePermission('couplet-content.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { coupletId, versionId } = await parseIds(params)

    // First check if couplet and version exist
    const [versionExists] = await db
      .select({ id: coupletVersions.id })
      .from(coupletVersions)
      .where(
        and(
          eq(coupletVersions.coupletId, coupletId),
          eq(coupletVersions.id, versionId)
        )
      )
      .limit(1)

    if (!versionExists) {
      return NextResponse.json(
        { success: false, error: 'Couplet or version not found' },
        { status: 404 },
      )
    }

    const contents = await db
      .select({
        id: coupletContents.id,
        upperLine: coupletContents.upperLine,
        lowerLine: coupletContents.lowerLine,
        horizontalScroll: coupletContents.horizontalScroll,
        appreciation: coupletContents.appreciation,
        orderIndex: coupletContents.orderIndex,
        createdAt: coupletContents.createdAt,
      })
      .from(coupletContents)
      .where(
        and(
          eq(coupletContents.coupletId, coupletId),
          eq(coupletContents.versionId, versionId)
        )
      )
      .orderBy(coupletContents.orderIndex)

    return NextResponse.json({
      success: true,
      data: {
        items: contents,
        total: contents.length,
      },
    })
  } catch (error) {
    console.error('Error fetching couplet version contents:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch couplet version contents',
      },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const permissionCheck = await requirePermission('couplet-content.create')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { coupletId, versionId } = await parseIds(params)
    const body = await request.json()

    // First check if couplet and version exist
    const [versionExists] = await db
      .select({ id: coupletVersions.id })
      .from(coupletVersions)
      .where(
        and(
          eq(coupletVersions.coupletId, coupletId),
          eq(coupletVersions.id, versionId)
        )
      )
      .limit(1)

    if (!versionExists) {
      return NextResponse.json(
        { success: false, error: 'Couplet or version not found' },
        { status: 404 },
      )
    }

    const [content] = await db
      .insert(coupletContents)
      .values({
        coupletId,
        versionId,
        upperLine: body.upperLine || '',
        lowerLine: body.lowerLine || '',
        horizontalScroll: body.horizontalScroll || '',
        appreciation: body.appreciation || '',
        orderIndex: body.orderIndex || 0,
      })
      .returning()

    logger.info({
      module: 'couplet-content',
      action: 'create',
      description: `Content created for version ${versionId}`,
    })

    return NextResponse.json({
      success: true,
      data: content,
    })
  } catch (error) {
    console.error('Error creating couplet version content:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create couplet version content',
      },
      { status: 500 },
    )
  }
}