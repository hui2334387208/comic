import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { comicStyles } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * 创作者端 - 创建或获取风格
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
      return NextResponse.json({ error: '风格名称和slug不能为空' }, { status: 400 })
    }

    // 检查风格是否已存在
    const existingStyle = await db
      .select()
      .from(comicStyles)
      .where(eq(comicStyles.slug, slug))
      .limit(1)

    if (existingStyle.length > 0) {
      // 风格已存在，返回现有风格
      return NextResponse.json({
        success: true,
        data: existingStyle[0],
        message: '风格已存在'
      })
    }

    // 创建新风格
    const [newStyle] = await db
      .insert(comicStyles)
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
      data: newStyle,
      message: '风格创建成功'
    })
  } catch (error: any) {
    console.error('创建风格失败:', error)
    return NextResponse.json(
      { success: false, error: '创建风格失败', detail: error?.message },
      { status: 500 }
    )
  }
}

/**
 * 创作者端 - 获取所有风格
 */
export async function GET(request: NextRequest) {
  try {
    const styles = await db
      .select()
      .from(comicStyles)
      .where(eq(comicStyles.status, 'active'))
      .orderBy(comicStyles.sortOrder)

    return NextResponse.json({
      success: true,
      data: styles
    })
  } catch (error: any) {
    console.error('获取风格列表失败:', error)
    return NextResponse.json(
      { success: false, error: '获取风格列表失败' },
      { status: 500 }
    )
  }
}
