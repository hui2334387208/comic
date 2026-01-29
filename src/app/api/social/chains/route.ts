import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { coupletChains, coupletChainEntries, users } from '@/db/schema'
import { eq, desc, count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // 构建查询条件
    let whereCondition = undefined
    if (status && status !== 'all') {
      whereCondition = eq(coupletChains.status, status)
    }

    // 获取接龙列表
    const chains = await db
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
        timeLimit: coupletChains.timeLimit,
        rules: coupletChains.rules,
        isPublic: coupletChains.isPublic,
        language: coupletChains.language,
        createdAt: coupletChains.createdAt,
        creatorName: users.name,
        creatorUsername: users.username,
      })
      .from(coupletChains)
      .leftJoin(users, eq(coupletChains.creatorId, users.id))
      .where(whereCondition)
      .orderBy(desc(coupletChains.createdAt))
      .limit(limit)
      .offset(offset)

    // 获取总数
    const totalResult = await db
      .select({ count: count() })
      .from(coupletChains)
      .where(whereCondition)

    const total = totalResult[0]?.count || 0

    // 为每个接龙获取最新条目和热门条目
    const chainsWithEntries = await Promise.all(
      chains.map(async (chain) => {
        // 获取最新接龙条目
        const latestEntries = await db
          .select({
            id: coupletChainEntries.id,
            content: coupletChainEntries.content,
            contentType: coupletChainEntries.contentType,
            likeCount: coupletChainEntries.likeCount,
            createdAt: coupletChainEntries.createdAt,
            userName: users.name,
            userUsername: users.username,
          })
          .from(coupletChainEntries)
          .leftJoin(users, eq(coupletChainEntries.userId, users.id))
          .where(eq(coupletChainEntries.chainId, chain.id))
          .orderBy(desc(coupletChainEntries.createdAt))
          .limit(1)

        // 获取热门接龙条目（按点赞数排序）
        const popularEntries = await db
          .select({
            id: coupletChainEntries.id,
            content: coupletChainEntries.content,
            contentType: coupletChainEntries.contentType,
            likeCount: coupletChainEntries.likeCount,
            createdAt: coupletChainEntries.createdAt,
            userName: users.name,
            userUsername: users.username,
          })
          .from(coupletChainEntries)
          .leftJoin(users, eq(coupletChainEntries.userId, users.id))
          .where(eq(coupletChainEntries.chainId, chain.id))
          .orderBy(desc(coupletChainEntries.likeCount))
          .limit(3)

        const latestEntry = latestEntries[0]
        const now = new Date()
        const createdTime = latestEntry ? new Date(latestEntry.createdAt) : null
        let timeAgo = '暂无接龙'
        
        if (createdTime) {
          const diffMs = now.getTime() - createdTime.getTime()
          const diffMinutes = Math.floor(diffMs / (1000 * 60))
          const diffHours = Math.floor(diffMinutes / 60)
          const diffDays = Math.floor(diffHours / 24)
          
          if (diffDays > 0) {
            timeAgo = `${diffDays}天前`
          } else if (diffHours > 0) {
            timeAgo = `${diffHours}小时前`
          } else if (diffMinutes > 0) {
            timeAgo = `${diffMinutes}分钟前`
          } else {
            timeAgo = '刚刚'
          }
        }

        return {
          ...chain,
          creator: chain.creatorName || chain.creatorUsername || '未知用户',
          lastEntry: latestEntry ? {
            content: latestEntry.content,
            user: latestEntry.userName || latestEntry.userUsername || '未知用户',
            time: timeAgo,
            likes: latestEntry.likeCount || 0
          } : null,
          recentEntries: popularEntries.map(entry => ({
            content: entry.content,
            user: entry.userName || entry.userUsername || '未知用户',
            likes: entry.likeCount || 0
          }))
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        chains: chainsWithEntries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('获取对联接龙列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取对联接龙列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      theme,
      creatorId,
      startLine,
      startLineType = 'upper',
      chainType = 'continuous',
      maxEntries = 100,
      timeLimit = 604800,
      rules,
      isPublic = true,
      language = 'zh'
    } = body

    // 验证必填字段
    if (!title || !creatorId || !startLine) {
      return NextResponse.json(
        { success: false, message: '标题、创建者ID和起始句为必填项' },
        { status: 400 }
      )
    }

    // 创建新接龙
    const newChain = await db.insert(coupletChains).values({
      title,
      description,
      theme,
      creatorId,
      startLine,
      startLineType,
      chainType,
      maxEntries,
      timeLimit,
      rules,
      isPublic,
      language,
      status: 'active',
      currentEntries: 0
    }).returning()

    return NextResponse.json({
      success: true,
      data: newChain[0],
      message: '对联接龙创建成功'
    })

  } catch (error) {
    console.error('创建对联接龙失败:', error)
    return NextResponse.json(
      { success: false, message: '创建对联接龙失败' },
      { status: 500 }
    )
  }
}