import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { coupletChains, coupletChainEntries } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const chainId = parseInt(id)
    const body = await request.json()
    const { content, contentType, userId } = body

    if (isNaN(chainId)) {
      return NextResponse.json(
        { success: false, message: '无效的接龙ID' },
        { status: 400 }
      )
    }

    if (!content || !contentType || !userId) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 检查接龙是否存在且状态为活跃
    const chain = await db
      .select()
      .from(coupletChains)
      .where(eq(coupletChains.id, chainId))
      .limit(1)

    if (chain.length === 0) {
      return NextResponse.json(
        { success: false, message: '接龙不存在' },
        { status: 404 }
      )
    }

    if (chain[0].status !== 'active') {
      return NextResponse.json(
        { success: false, message: '接龙已结束，无法参与' },
        { status: 400 }
      )
    }

    // 检查是否已达到最大条目数
    if ((chain[0].currentEntries || 0) >= (chain[0].maxEntries || 0)) {
      return NextResponse.json(
        { success: false, message: '接龙已满，无法参与' },
        { status: 400 }
      )
    }

    // 创建新的接龙条目
    const newEntry = await db.insert(coupletChainEntries).values({
      chainId,
      userId,
      content,
      contentType,
      orderIndex: (chain[0].currentEntries || 0) + 1
    }).returning()

    // 更新接龙的当前条目数
    await db
      .update(coupletChains)
      .set({ 
        currentEntries: (chain[0].currentEntries || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(coupletChains.id, chainId))

    return NextResponse.json({
      success: true,
      data: newEntry[0],
      message: '接龙提交成功'
    })

  } catch (error) {
    console.error('提交接龙失败:', error)
    return NextResponse.json(
      { success: false, message: '提交接龙失败' },
      { status: 500 }
    )
  }
}