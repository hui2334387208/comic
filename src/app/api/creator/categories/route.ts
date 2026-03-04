import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { comicCategories } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * 创作者端 - 创建或获取分类
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, description, icon, color } = body

    if (!name || !slug) {
      return NextResponse.json({ error: '分类名称和slug不能为空' }, { status: 400 })
    }

    // 检查分类是否已存在
    const existingCategory = await db
      .select()
      .from(comicCategories)
      .where(eq(comicCategories.slug, slug))
      .limit(1)

    if (existingCategory.length > 0) {
      // 分类已存在，返回现有分类
      return NextResponse.json({
        success: true,
        data: existingCategory[0],
        message: '分类已存在'
      })
    }

    // 创建新分类
    const [newCategory] = await db
      .insert(comicCategories)
      .values({
        name,
        slug,
        description: description || null,
        icon: icon || null,
        color: color || null,
        status: 'active',
        sortOrder: 0,
      })
      .returning()

    return NextResponse.json({
      success: true,
      data: newCategory,
      message: '分类创建成功'
    })
  } catch (error: any) {
    console.error('创建分类失败:', error)
    return NextResponse.json(
      { success: false, error: '创建分类失败', detail: error?.message },
      { status: 500 }
    )
  }
}

/**
 * 创作者端 - 获取所有分类
 */
export async function GET(request: NextRequest) {
  try {
    const categories = await db
      .select()
      .from(comicCategories)
      .where(eq(comicCategories.status, 'active'))
      .orderBy(comicCategories.sortOrder)

    return NextResponse.json({
      success: true,
      data: categories
    })
  } catch (error: any) {
    console.error('获取分类列表失败:', error)
    return NextResponse.json(
      { success: false, error: '获取分类列表失败' },
      { status: 500 }
    )
  }
}
