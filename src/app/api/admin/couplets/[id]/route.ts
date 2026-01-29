'use server'

import { NextRequest, NextResponse } from 'next/server'
import { and, eq, ne } from 'drizzle-orm'

import { db } from '@/db'
import { couplets, coupletCategories, users } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

type CoupletStatus = 'published' | 'draft' | 'archived'

interface CoupletPayload {
  title: string
  slug?: string
  description?: string
  categoryId?: number
  status?: CoupletStatus
  isPublic?: boolean
  isFeatured?: boolean
  language?: string
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

async function ensureUniqueSlug(baseSlug: string, currentId: number) {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await db
      .select({ id: couplets.id })
      .from(couplets)
      .where(
        and(eq(couplets.slug, slug), ne(couplets.id, currentId)),
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
  const permissionCheck = await requirePermission('couplet.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const id = await parseId(params)

    const [couplet] = await db
      .select({
        id: couplets.id,
        title: couplets.title,
        slug: couplets.slug,
        description: couplets.description,
        status: couplets.status,
        isPublic: couplets.isPublic,
        isFeatured: couplets.isFeatured,
        viewCount: couplets.viewCount,
        likeCount: couplets.likeCount,
        hot: couplets.hot,
        model: couplets.model,
        prompt: couplets.prompt,
        language: couplets.language,
        createdAt: couplets.createdAt,
        updatedAt: couplets.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        category: {
          id: coupletCategories.id,
          name: coupletCategories.name,
          slug: coupletCategories.slug,
        },
      })
      .from(couplets)
      .leftJoin(users, eq(couplets.authorId, users.id))
      .leftJoin(coupletCategories, eq(couplets.categoryId, coupletCategories.id))
      .where(eq(couplets.id, id))
      .limit(1)

    if (!couplet) {
      return NextResponse.json(
        { success: false, error: 'Couplet not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: couplet,
    })
  } catch (error) {
    logger.error({
      module: 'couplets',
      action: 'fetch',
      description: `Error fetching couplet: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch couplet',
      },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('couplet.update')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const id = await parseId(params)
    const body: CoupletPayload = await request.json()

    if (!body.title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Couplet title is required' },
        { status: 400 },
      )
    }

    const baseSlug = body.slug?.trim() || slugify(body.title)
    const slug = await ensureUniqueSlug(baseSlug, id)

    const [updated] = await db
      .update(couplets)
      .set({
        title: body.title,
        slug,
        description: body.description || '',
        categoryId: body.categoryId || null,
        status: body.status || 'draft',
        isPublic: body.isPublic ?? true,
        isFeatured: body.isFeatured ?? false,
        language: body.language || 'en',
        updatedAt: new Date(),
      })
      .where(eq(couplets.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Couplet not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'couplets',
      action: 'update',
      description: `Couplet updated: ${updated.title} (ID: ${updated.id})`,
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    logger.error({
      module: 'couplets',
      action: 'update',
      description: `Error updating couplet: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update couplet',
      },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('couplet.update')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const id = await parseId(params)
    const body = await request.json()

    const [updated] = await db
      .update(couplets)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(couplets.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Couplet not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'couplets',
      action: 'patch',
      description: `Couplet patched: ${updated.title} (ID: ${updated.id})`,
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    logger.error({
      module: 'couplets',
      action: 'patch',
      description: `Error patching couplet: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update couplet',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('couplet.delete')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const id = await parseId(params)
    const [deleted] = await db
      .delete(couplets)
      .where(eq(couplets.id, id))
      .returning({ id: couplets.id, title: couplets.title })

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Couplet not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'couplets',
      action: 'delete',
      description: `Couplet deleted: ${deleted.title} (ID: ${deleted.id})`,
    })

    return NextResponse.json({
      success: true,
      data: deleted,
    })
  } catch (error) {
    logger.error({
      module: 'couplets',
      action: 'delete',
      description: `Error deleting couplet: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete couplet',
      },
      { status: 500 },
    )
  }
}