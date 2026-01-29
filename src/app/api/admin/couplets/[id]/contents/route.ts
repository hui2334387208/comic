'use server'

import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { coupletContents, couplets } from '@/db/schema'
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
  const permissionCheck = await requirePermission('couplet-content.read')(request)
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
      .where(eq(coupletContents.coupletId, coupletId))
      .orderBy(coupletContents.orderIndex)

    return NextResponse.json({
      success: true,
      data: {
        items: contents,
        total: contents.length,
      },
    })
  } catch (error) {
    console.error('Error fetching couplet contents:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch couplet contents',
      },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('couplet-content.create')(request)
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

    // Get the latest version ID (assuming we're working with the latest version)
    // For now, we'll use a placeholder version ID of 1
    const versionId = 1

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
      description: `Content created for couplet ${coupletId}`,
    })

    return NextResponse.json({
      success: true,
      data: content,
    })
  } catch (error) {
    console.error('Error creating couplet content:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create couplet content',
      },
      { status: 500 },
    )
  }
}