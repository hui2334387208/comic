'use server'

import { NextRequest, NextResponse } from 'next/server'
import { and, eq, ne } from 'drizzle-orm'

import { db } from '@/db'
import { coupletCategories } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

type CategoryStatus = 'active' | 'inactive'

interface CategoryPayload {
  name: string
  slug?: string
  description?: string
  icon?: string
  color?: string
  status?: CategoryStatus
  sortOrder?: number
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
      .select({ id: coupletCategories.id })
      .from(coupletCategories)
      .where(
        and(eq(coupletCategories.slug, slug), ne(coupletCategories.id, currentId)),
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
  const permissionCheck = await requirePermission('couplet-category.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const id = await parseId(params)

    const [category] = await db
      .select()
      .from(coupletCategories)
      .where(eq(coupletCategories.id, id))
      .limit(1)

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Couplet category not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: category,
    })
  } catch (error) {
    logger.error({
      module: 'couplet-categories',
      action: 'fetch',
      description: `Error fetching couplet category: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch couplet category',
      },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('couplet-category.update')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const id = await parseId(params)
    const body: CategoryPayload = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 },
      )
    }

    const baseSlug = body.slug?.trim() || slugify(body.name)
    const slug = await ensureUniqueSlug(baseSlug, id)
    const status = body.status || 'active'

    const [updated] = await db
      .update(coupletCategories)
      .set({
        name: body.name,
        slug,
        description: body.description || '',
        icon: body.icon || '📝',
        color: body.color || '#1890ff',
        status,
        sortOrder: body.sortOrder || 0,
        updatedAt: new Date(),
      })
      .where(eq(coupletCategories.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Couplet category not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'couplet-categories',
      action: 'update',
      description: `Couplet category updated: ${updated.name} (ID: ${updated.id})`,
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    logger.error({
      module: 'couplet-categories',
      action: 'update',
      description: `Error updating couplet category: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update couplet category',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('couplet-category.delete')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const id = await parseId(params)
    const [deleted] = await db
      .delete(coupletCategories)
      .where(eq(coupletCategories.id, id))
      .returning({ id: coupletCategories.id, name: coupletCategories.name })

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Couplet category not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'couplet-categories',
      action: 'delete',
      description: `Couplet category deleted: ${deleted.name} (ID: ${deleted.id})`,
    })

    return NextResponse.json({
      success: true,
      data: deleted,
    })
  } catch (error) {
    logger.error({
      module: 'couplet-categories',
      action: 'delete',
      description: `Error deleting couplet category: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete couplet category',
      },
      { status: 500 },
    )
  }
}