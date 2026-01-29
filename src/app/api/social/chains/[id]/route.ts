import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { coupletChains, coupletChainEntries, users } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const chainId = parseInt(id)

    if (isNaN(chainId)) {
      return NextResponse.json(
        { success: false, message: '无效的接龙ID' },
        { status: 400 }
      )
    }

    // 获取接龙基本信息
    const chain = await db
      .select({
        id: coupletChains.id,
        title: coupletChains.title,
        description: coupletChains.description,
        theme: coupletChains.theme,
        startLine: coupletChains.startLine,
        startLineType: coupletChains.startLineType,
        status: coupletChains.status,
        chainType: coupletChains.chainType,
        maxEntries: coupletChains.maxEntries,
        currentEntries: coupletChains.currentEntries,
        createdAt: coupletChains.createdAt,
        creatorName: users.name,
        creatorUsername: users.username,
      })
      .from(coupletChains)
      .leftJoin(users, eq(coupletChains.creatorId, users.id))
      .where(eq(coupletChains.id, chainId))
      .limit(1)

    if (chain.length === 0) {
      return NextResponse.json(
        { success: false, message: '接龙不存在' },
        { status: 404 }
      )
    }

    // 获取接龙条目
    const entries = await db
      .select({
        id: coupletChainEntries.id,
        content: coupletChainEntries.content,
        contentType: coupletChainEntries.contentType,
        likeCount: coupletChainEntries.likeCount,
        isSelected: coupletChainEntries.isSelected,
        createdAt: coupletChainEntries.createdAt,
        userName: users.name,
        userUsername: users.username,
      })
      .from(coupletChainEntries)
      .leftJoin(users, eq(coupletChainEntries.userId, users.id))
      .where(eq(coupletChainEntries.chainId, chainId))
      .orderBy(desc(coupletChainEntries.createdAt))

    const chainDetail = {
      ...chain[0],
      creator: chain[0].creatorName || chain[0].creatorUsername || '未知用户',
      entries: entries.map(entry => ({
        ...entry,
        user: entry.userName || entry.userUsername || '未知用户',
        likes: entry.likeCount || 0
      }))
    }

    return NextResponse.json({
      success: true,
      data: chainDetail
    })

  } catch (error) {
    console.error('获取接龙详情失败:', error)
    return NextResponse.json(
      { success: false, message: '获取接龙详情失败' },
      { status: 500 }
    )
  }
}