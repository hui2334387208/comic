'use server'

import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm'

import { db } from '@/db'
import { comicCategories } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(request: NextRequest) {
  const permissionCheck = await requirePermission('comic-category.read')(request)
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
          ilike(comicCategories.name, `%${search}%`),
          ilike(comicCategories.slug, `%${search}%`),
        ),
      )
    }

    if (status && ['active', 'inactive'].includes(status)) {
      conditions.push(eq(comicCategories.status, status))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const totalResult = await db
      .select({ value: sql<number>`count(*)` })
      .from(comicCategories)
      .where(whereClause)
    const total = Number(totalResult[0]?.value || 0)

    const items = await db
      .select()
      .from(comicCategories)
      .where(whereClause)
      .orderBy(comicCategories.sortOrder, desc(comicCategories.createdAt))
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
      module: 'comic-categories',
      action: 'fetch',
      description: `Error fetching categories: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const permissionCheck = await requirePermission('comic-category.create')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const body = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 },
      )
    }

    const slug = body.slug?.trim() || body.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100)

    const [category] = await db
      .insert(comicCategories)
      .values({
        name: body.name,
        slug,
        description: body.description || null,
        icon: body.icon || null,
        color: body.color || null,
        status: body.status || 'active',
        sortOrder: body.sortOrder || 0,
      })
      .returning()

    logger.info({
      module: 'comic-categories',
      action: 'create',
      description: `Category created: ${category.name} (ID: ${category.id})`,
    })

    return NextResponse.json({
      success: true,
      data: category,
    })
  } catch (error) {
    logger.error({
      module: 'comic-categories',
      action: 'create',
      description: `Error creating category: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create category',
      },
      { status: 500 },
    )
  }
}
