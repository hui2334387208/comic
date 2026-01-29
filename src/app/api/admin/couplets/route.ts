'use server'

import { NextRequest, NextResponse } from 'next/server'
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm'

import { db } from '@/db'
import { couplets, coupletCategories, users } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(request: NextRequest) {
  const permissionCheck = await requirePermission('couplet.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const categoryId = searchParams.get('categoryId') || ''

    const offset = (page - 1) * pageSize
    const conditions = []

    if (search) {
      conditions.push(
        or(
          ilike(couplets.title, `%${search}%`),
          ilike(couplets.description, `%${search}%`),
          ilike(couplets.slug, `%${search}%`),
        ),
      )
    }

    if (status && ['published', 'draft', 'archived'].includes(status)) {
      conditions.push(eq(couplets.status, status))
    }

    if (categoryId) {
      conditions.push(eq(couplets.categoryId, parseInt(categoryId)))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const totalResult = await db
      .select({ value: sql<number>`count(*)` })
      .from(couplets)
      .where(whereClause)
    const total = Number(totalResult[0]?.value || 0)

    const items = await db
      .select({
        id: couplets.id,
        title: couplets.title,
        slug: couplets.slug,
        description: couplets.description,
        status: couplets.status,
        isPublic: couplets.isPublic,
        viewCount: couplets.viewCount,
        likeCount: couplets.likeCount,
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
        },
      })
      .from(couplets)
      .leftJoin(users, eq(couplets.authorId, users.id))
      .leftJoin(coupletCategories, eq(couplets.categoryId, coupletCategories.id))
      .where(whereClause)
      .orderBy(desc(couplets.createdAt))
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
      module: 'couplets',
      action: 'fetch',
      description: `Error fetching couplets: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch couplets',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const permissionCheck = await requirePermission('couplet.create')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const body = await request.json()

    if (!body.title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Couplet title is required' },
        { status: 400 },
      )
    }

    // Generate slug from title if not provided
    const slug = body.slug?.trim() || body.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100)

    const [couplet] = await db
      .insert(couplets)
      .values({
        title: body.title,
        slug,
        description: body.description || '',
        categoryId: body.categoryId || null,
        authorId: body.authorId || null,
        status: body.status || 'draft',
        isPublic: body.isPublic ?? true,
        language: body.language || 'en',
      })
      .returning()

    logger.info({
      module: 'couplets',
      action: 'create',
      description: `Couplet created: ${couplet.title} (ID: ${couplet.id})`,
    })

    return NextResponse.json({
      success: true,
      data: couplet,
    })
  } catch (error) {
    logger.error({
      module: 'couplets',
      action: 'create',
      description: `Error creating couplet: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create couplet',
      },
      { status: 500 },
    )
  }
}