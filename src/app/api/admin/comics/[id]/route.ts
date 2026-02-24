'use server'

import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { comics, comicCategories, users } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('comic.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { id } = await params
    const comicId = parseInt(id)

    if (isNaN(comicId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid comic ID' },
        { status: 400 },
      )
    }

    const result = await db
      .select({
        id: comics.id,
        title: comics.title,
        slug: comics.slug,
        description: comics.description,
        status: comics.status,
        isPublic: comics.isPublic,
        isFeatured: comics.isFeatured,
        viewCount: comics.viewCount,
        likeCount: comics.likeCount,
        hot: comics.hot,
        model: comics.model,
        prompt: comics.prompt,
        language: comics.language,
        coverImage: comics.coverImage,
        volumeCount: comics.volumeCount,
        episodeCount: comics.episodeCount,
        style: comics.style,
        categoryId: comics.categoryId,
        authorId: comics.authorId,
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
          slug: comicCategories.slug,
        },
      })
      .from(comics)
      .leftJoin(users, eq(comics.authorId, users.id))
      .leftJoin(comicCategories, eq(comics.categoryId, comicCategories.id))
      .where(eq(comics.id, comicId))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comic not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    })
  } catch (error) {
    logger.error({
      module: 'comics',
      action: 'fetch',
      description: `Error fetching comic: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch comic',
      },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('comic.update')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { id } = await params
    const comicId = parseInt(id)

    if (isNaN(comicId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid comic ID' },
        { status: 400 },
      )
    }

    const body = await request.json()

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (body.title !== undefined) updateData.title = body.title
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.description !== undefined) updateData.description = body.description
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.status !== undefined) updateData.status = body.status
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured
    if (body.language !== undefined) updateData.language = body.language
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage
    if (body.style !== undefined) updateData.style = body.style
    if (body.model !== undefined) updateData.model = body.model
    if (body.prompt !== undefined) updateData.prompt = body.prompt

    const [updatedComic] = await db
      .update(comics)
      .set(updateData)
      .where(eq(comics.id, comicId))
      .returning()

    if (!updatedComic) {
      return NextResponse.json(
        { success: false, error: 'Comic not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'comics',
      action: 'update',
      description: `Comic updated: ${updatedComic.title} (ID: ${updatedComic.id})`,
    })

    return NextResponse.json({
      success: true,
      data: updatedComic,
    })
  } catch (error) {
    logger.error({
      module: 'comics',
      action: 'update',
      description: `Error updating comic: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update comic',
      },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return PUT(request, { params })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('comic.delete')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { id } = await params
    const comicId = parseInt(id)

    if (isNaN(comicId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid comic ID' },
        { status: 400 },
      )
    }

    const [deletedComic] = await db
      .delete(comics)
      .where(eq(comics.id, comicId))
      .returning()

    if (!deletedComic) {
      return NextResponse.json(
        { success: false, error: 'Comic not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'comics',
      action: 'delete',
      description: `Comic deleted: ${deletedComic.title} (ID: ${deletedComic.id})`,
    })

    return NextResponse.json({
      success: true,
      data: deletedComic,
    })
  } catch (error) {
    logger.error({
      module: 'comics',
      action: 'delete',
      description: `Error deleting comic: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete comic',
      },
      { status: 500 },
    )
  }
}
