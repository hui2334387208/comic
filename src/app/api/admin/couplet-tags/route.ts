'use server'

import { NextRequest, NextResponse } from 'next/server'
import { and, asc, eq, ilike, ne, or, sql } from 'drizzle-orm'

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

async function ensureUniqueSlug(baseSlug: string, currentId?: number) {
  let slug = baseSlug || `tag-${Date.now()}`
  let counter = 1

  while (true) {
    const conditions = [eq(coupletTags.slug, slug)]

    if (currentId) {
      conditions.push(ne(coupletTags.id, currentId))
    }

    const existing = await db
      .select({ id: coupletTags.id })
      .from(coupletTags)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .limit(1)

    if (existing.length === 0) {
      return slug
    }

    slug = `${baseSlug}-${counter++}`
  }
}

export async function GET(request: NextRequest) {
  const permissionCheck = await requirePermission('couplet-tag.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const offset = (page - 1) * pageSize
    const conditions = []

    if (search) {
      conditions.push(
        or(
          ilike(coupletTags.name, `%${search}%`),
          ilike(coupletTags.slug, `%${search}%`),
        ),
      )
    }

    if (status && ['active', 'inactive'].includes(status)) {
      conditions.push(eq(coupletTags.status, status))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const totalResult = await db
      .select({ value: sql<number>`count(*)` })
      .from(coupletTags)
      .where(whereClause)
    const total = Number(totalResult[0]?.value || 0)

    const items = await db
      .select({
        id: coupletTags.id,
        name: coupletTags.name,
        slug: coupletTags.slug,
        color: coupletTags.color,
        status: coupletTags.status,
        createdAt: coupletTags.createdAt,
      })
      .from(coupletTags)
      .where(whereClause)
      .orderBy(asc(coupletTags.name))
      .limit(pageSize)
      .offset(offset)

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    })
  } catch (error) {
    logger.error({
      module: 'couplet-tags',
      action: 'fetch',
      description: `Error fetching couplet tags: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch couplet tags',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const permissionCheck = await requirePermission('couplet-tag.create')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const body: TagPayload = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tag name is required' },
        { status: 400 },
      )
    }

    const baseSlug = body.slug?.trim() || slugify(body.name)
    const slug = await ensureUniqueSlug(baseSlug)
    const status = body.status || 'active'

    const [tag] = await db
      .insert(coupletTags)
      .values({
        name: body.name,
        slug,
        color: body.color || '#1890ff',
        status,
      })
      .returning()

    logger.info({
      module: 'couplet-tags',
      action: 'create',
      description: `Couplet tag created: ${tag.name} (ID: ${tag.id})`,
    })

    return NextResponse.json({
      success: true,
      data: tag,
    })
  } catch (error) {
    logger.error({
      module: 'couplet-tags',
      action: 'create',
      description: `Error creating couplet tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create couplet tag',
      },
      { status: 500 },
    )
  }
}