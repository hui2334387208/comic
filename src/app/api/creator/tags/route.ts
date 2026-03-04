import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { comicTags } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'

/**
 * 创作者端 - 批量创建或获取标签
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const { tags } = body

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json({ error: '标签数据不能为空' }, { status: 400 })
    }

    const results = []

    for (const tag of tags) {
      const { name, slug, description, icon, color } = tag

      if (!name || !slug) {
        continue // 跳过无效标签
      }

      // 检查标签是否已存在
      const existingTag = await db
        .select()
        .from(comicTags)
        .where(eq(comicTags.slug, slug))
        .limit(1)

      if (existingTag.length > 0) {
        // 标签已存在，使用现有标签
        results.push(existingTag[0])
      } else {
        // 创建新标签
        const [newTag] = await db
          .insert(comicTags)
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

        results.push(newTag)
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `成功处理 ${results.length} 个标签`
    })
  } catch (error: any) {
    console.error('创建标签失败:', error)
    return NextResponse.json(
      { success: false, error: '创建标签失败', detail: error?.message },
      { status: 500 }
    )
  }
}

/**
 * 创作者端 - 获取所有标签
 */
export async function GET(request: NextRequest) {
  try {
    const tags = await db
      .select()
      .from(comicTags)
      .where(eq(comicTags.status, 'active'))
      .orderBy(comicTags.sortOrder)

    return NextResponse.json({
      success: true,
      data: tags
    })
  } catch (error: any) {
    console.error('获取标签列表失败:', error)
    return NextResponse.json(
      { success: false, error: '获取标签列表失败' },
      { status: 500 }
    )
  }
}
