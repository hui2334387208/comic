'use server'

import { NextRequest, NextResponse } from 'next/server'
import { and, asc, eq, ilike, ne, or, sql } from 'drizzle-orm'

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

async function ensureUniqueSlug(baseSlug: string, currentId?: number) {
  let slug = baseSlug || `category-${Date.now()}`
  let counter = 1

  while (true) {
    const conditions = [eq(coupletCategories.slug, slug)]

    if (currentId) {
      conditions.push(ne(coupletCategories.id, currentId))
    }

    const existing = await db
      .select({ id: coupletCategories.id })
      .from(coupletCategories)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .limit(1)

    if (existing.length === 0) {
      return slug
    }

    slug = `${baseSlug}-${counter++}`
  }
}

export async function GET(request: NextRequest) {
  const permissionCheck = await requirePermission('couplet-category.read')(request)
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
          ilike(coupletCategories.name, `%${search}%`),
          ilike(coupletCategories.slug, `%${search}%`),
          ilike(coupletCategories.description, `%${search}%`),
        ),
      )
    }

    if (status && ['active', 'inactive'].includes(status)) {
      conditions.push(eq(coupletCategories.status, status))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const totalResult = await db
      .select({ value: sql<number>`count(*)` })
      .from(coupletCategories)
      .where(whereClause)
    const total = Number(totalResult[0]?.value || 0)

    const items = await db
      .select({
        id: coupletCategories.id,
        name: coupletCategories.name,
        slug: coupletCategories.slug,
        description: coupletCategories.description,
        icon: coupletCategories.icon,
        color: coupletCategories.color,
        status: coupletCategories.status,
        sortOrder: coupletCategories.sortOrder,
        createdAt: coupletCategories.createdAt,
        updatedAt: coupletCategories.updatedAt,
      })
      .from(coupletCategories)
      .where(whereClause)
      .orderBy(asc(coupletCategories.sortOrder), asc(coupletCategories.name))
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
      module: 'couplet-categories',
      action: 'fetch',
      description: `Error fetching couplet categories: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch couplet categories',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const permissionCheck = await requirePermission('couplet-category.create')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const body: CategoryPayload = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 },
      )
    }

    const baseSlug = body.slug?.trim() || slugify(body.name)
    const slug = await ensureUniqueSlug(baseSlug)
    const status = body.status || 'active'

    const [category] = await db
      .insert(coupletCategories)
      .values({
        name: body.name,
        slug,
        description: body.description || '',
        icon: body.icon || '📝',
        color: body.color || '#1890ff',
        status,
        sortOrder: body.sortOrder || 0,
      })
      .returning()

    logger.info({
      module: 'couplet-categories',
      action: 'create',
      description: `Couplet category created: ${category.name} (ID: ${category.id})`,
    })

    return NextResponse.json({
      success: true,
      data: category,
    })
  } catch (error) {
    logger.error({
      module: 'couplet-categories',
      action: 'create',
      description: `Error creating couplet category: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create couplet category',
      },
      { status: 500 },
    )
  }
}