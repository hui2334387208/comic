'use server'

import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm'

import { db } from '@/db'
import { comicTags } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(request: NextRequest) {
  const permissionCheck = await requirePermission('comic-tag.read')(request)
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
          ilike(comicTags.name, `%${search}%`),
          ilike(comicTags.slug, `%${search}%`),
        ),
      )
    }

    if (status && ['active', 'inactive'].includes(status)) {
      conditions.push(eq(comicTags.status, status))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const totalResult = await db
      .select({ value: sql<number>`count(*)` })
      .from(comicTags)
      .where(whereClause)
    const total = Number(totalResult[0]?.value || 0)

    const items = await db
      .select()
      .from(comicTags)
      .where(whereClause)
      .orderBy(desc(comicTags.createdAt))
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
      module: 'comic-tags',
      action: 'fetch',
      description: `Error fetching tags: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tags',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const permissionCheck = await requirePermission('comic-tag.create')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const body = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tag name is required' },
        { status: 400 },
      )
    }

    const slug = body.slug?.trim() || body.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100)

    const [tag] = await db
      .insert(comicTags)
      .values({
        name: body.name,
        slug,
        color: body.color || null,
        status: body.status || 'active',
      })
      .returning()

    logger.info({
      module: 'comic-tags',
      action: 'create',
      description: `Tag created: ${tag.name} (ID: ${tag.id})`,
    })

    return NextResponse.json({
      success: true,
      data: tag,
    })
  } catch (error) {
    logger.error({
      module: 'comic-tags',
      action: 'create',
      description: `Error creating tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create tag',
      },
      { status: 500 },
    )
  }
}
