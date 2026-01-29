'use server'

import { NextRequest, NextResponse } from 'next/server'
import { and, eq, ne } from 'drizzle-orm'

import { db } from '@/db'
import { coupletTags } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

type TagStatus = 'active' | 'inactive'

interface TagPayload {
  name: string
  slug?: string
  color?: string
  status?: TagStatus
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

async function ensureUniqueSlug(baseSlug: string, currentId: number) {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await db
      .select({ id: coupletTags.id })
      .from(coupletTags)
      .where(
        and(eq(coupletTags.slug, slug), ne(coupletTags.id, currentId)),
      )
      .limit(1)

    if (existing.length === 0) {
      return slug
    }

    slug = `${baseSlug}-${counter++}`
  }
}

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
  const permissionCheck = await requirePermission('couplet-tag.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const id = await parseId(params)

    const [tag] = await db
      .select()
      .from(coupletTags)
      .where(eq(coupletTags.id, id))
      .limit(1)

    if (!tag) {
      return NextResponse.json(
        { success: false, error: 'Couplet tag not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: tag,
    })
  } catch (error) {
    logger.error({
      module: 'couplet-tags',
      action: 'fetch',
      description: `Error fetching couplet tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch couplet tag',
      },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('couplet-tag.update')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const id = await parseId(params)
    const body: TagPayload = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tag name is required' },
        { status: 400 },
      )
    }

    const baseSlug = body.slug?.trim() || slugify(body.name)
    const slug = await ensureUniqueSlug(baseSlug, id)
    const status = body.status || 'active'

    const [updated] = await db
      .update(coupletTags)
      .set({
        name: body.name,
        slug,
        color: body.color || '#1890ff',
        status,
      })
      .where(eq(coupletTags.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Couplet tag not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'couplet-tags',
      action: 'update',
      description: `Couplet tag updated: ${updated.name} (ID: ${updated.id})`,
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    logger.error({
      module: 'couplet-tags',
      action: 'update',
      description: `Error updating couplet tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update couplet tag',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('couplet-tag.delete')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const id = await parseId(params)
    const [deleted] = await db
      .delete(coupletTags)
      .where(eq(coupletTags.id, id))
      .returning({ id: coupletTags.id, name: coupletTags.name })

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Couplet tag not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'couplet-tags',
      action: 'delete',
      description: `Couplet tag deleted: ${deleted.name} (ID: ${deleted.id})`,
    })

    return NextResponse.json({
      success: true,
      data: deleted,
    })
  } catch (error) {
    logger.error({
      module: 'couplet-tags',
      action: 'delete',
      description: `Error deleting couplet tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete couplet tag',
      },
      { status: 500 },
    )
  }
}