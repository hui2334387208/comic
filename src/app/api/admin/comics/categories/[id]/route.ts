'use server'

import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { comicCategories } from '@/db/schema'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('comic-category.read')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { id } = await params
    const categoryId = parseInt(id)

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 },
      )
    }

    const [category] = await db
      .select()
      .from(comicCategories)
      .where(eq(comicCategories.id, categoryId))
      .limit(1)

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: category,
    })
  } catch (error) {
    logger.error({
      module: 'comic-categories',
      action: 'fetch',
      description: `Error fetching category: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch category',
      },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('comic-category.update')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { id } = await params
    const categoryId = parseInt(id)

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 },
      )
    }

    const body = await request.json()

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.description !== undefined) updateData.description = body.description
    if (body.icon !== undefined) updateData.icon = body.icon
    if (body.color !== undefined) updateData.color = body.color
    if (body.status !== undefined) updateData.status = body.status
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder

    const [updatedCategory] = await db
      .update(comicCategories)
      .set(updateData)
      .where(eq(comicCategories.id, categoryId))
      .returning()

    if (!updatedCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'comic-categories',
      action: 'update',
      description: `Category updated: ${updatedCategory.name} (ID: ${updatedCategory.id})`,
    })

    return NextResponse.json({
      success: true,
      data: updatedCategory,
    })
  } catch (error) {
    logger.error({
      module: 'comic-categories',
      action: 'update',
      description: `Error updating category: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update category',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permissionCheck = await requirePermission('comic-category.delete')(request)
  if (permissionCheck) {
    return permissionCheck
  }

  try {
    const { id } = await params
    const categoryId = parseInt(id)

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 },
      )
    }

    const [deletedCategory] = await db
      .delete(comicCategories)
      .where(eq(comicCategories.id, categoryId))
      .returning()

    if (!deletedCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 },
      )
    }

    logger.info({
      module: 'comic-categories',
      action: 'delete',
      description: `Category deleted: ${deletedCategory.name} (ID: ${deletedCategory.id})`,
    })

    return NextResponse.json({
      success: true,
      data: deletedCategory,
    })
  } catch (error) {
    logger.error({
      module: 'comic-categories',
      action: 'delete',
      description: `Error deleting category: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete category',
      },
      { status: 500 },
    )
  }
}
