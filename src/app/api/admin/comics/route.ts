'use server'

import { NextRequest, NextResponse } from 'next/server'
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm'

import { db } from '@/db'
import { comics, comicCategories, users } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(request: NextRequest) {
  const permissionCheck = await requirePermission('comic.read')(request)
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
          ilike(comics.title, `%${search}%`),
          ilike(comics.description, `%${search}%`),
          ilike(comics.slug, `%${search}%`),
        ),
      )
    }

    if (status && ['published', 'draft', 'archived'].includes(status)) {
      conditions.push(eq(comics.status, status))
    }

    if (categoryId) {
      conditions.push(eq(comics.categoryId, parseInt(categoryId)))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const totalResult = await db
      .select({ value: sql<number>`count(*)` })
      .from(comics)
      .where(whereClause)
    const total = Number(totalResult[0]?.value || 0)

    const items = await db
      .select({
        id: comics.id,
        title: comics.title,
        slug: comics.slug,
        description: comics.description,
        status: comics.status,
        isPublic: comics.isPublic,
        viewCount: comics.viewCount,
        likeCount: comics.likeCount,
        volumeCount: comics.volumeCount,
        episodeCount: comics.episodeCount,
        coverImage: comics.coverImage,
        createdAt: comics.createdAt,
        updatedAt: comics.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        category: {
          id: comicCategories.id,
          name: comicCategories.name,
        },
      })
      .from(comics)
      .leftJoin(users, eq(comics.authorId, users.id))
      .leftJoin(comicCategories, eq(comics.categoryId, comicCategories.id))
      .where(whereClause)
      .orderBy(desc(comics.createdAt))
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
      module: 'comics',
      action: 'fetch',
      description: `Error fetching comics: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch comics',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const permissionCheck = await requirePermission('comic.create')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const body = await request.json()

    if (!body.title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Comic title is required' },
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

    const [comic] = await db
      .insert(comics)
      .values({
        title: body.title,
        slug,
        description: body.description || '',
        categoryId: body.categoryId || null,
        authorId: body.authorId || null,
        status: body.status || 'draft',
        isPublic: body.isPublic ?? true,
        isFeatured: body.isFeatured ?? false,
        language: body.language || 'zh',
        coverImage: body.coverImage || null,
        style: body.style || null,
        model: body.model || null,
        prompt: body.prompt || null,
        volumeCount: 0,
        episodeCount: 0,
      })
      .returning()

    logger.info({
      module: 'comics',
      action: 'create',
      description: `Comic created: ${comic.title} (ID: ${comic.id})`,
    })

    return NextResponse.json({
      success: true,
      data: comic,
    })
  } catch (error) {
    logger.error({
      module: 'comics',
      action: 'create',
      description: `Error creating comic: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create comic',
      },
      { status: 500 },
    )
  }
}
