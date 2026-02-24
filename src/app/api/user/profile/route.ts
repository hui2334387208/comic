import { eq, and, sql, count } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { users, userVipStatus, generationRateLimits } from '@/db/schema'
import { comics, comicFavorites, comicLikes } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'

// GET /api/user/profile - 获取用户个人资料
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const userId = session.user.id
    const today = new Date().toISOString().slice(0, 10)

    // 获取用户基本信息
    const userData = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        username: users.username,
        avatar: users.avatar,
        role: users.role,
        createdAt: users.created_at,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!userData.length) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const user = userData[0]

    // 获取VIP状态
    const vipStatus = await db
      .select({
        isVip: userVipStatus.isVip,
        vipExpireDate: userVipStatus.vipExpireDate,
        autoRenew: userVipStatus.autoRenew,
      })
      .from(userVipStatus)
      .where(eq(userVipStatus.userId, userId))
      .limit(1)

    // 获取今日AI使用次数
    const aiUsage = await db
      .select({ count: generationRateLimits.count })
      .from(generationRateLimits)
      .where(
        and(
          eq(generationRateLimits.identifier, userId),
          eq(generationRateLimits.day, today),
        ),
      )
      .limit(1)

    const aiUsageCount = aiUsage[0]?.count || 0

    // 修复VIP状态检查逻辑：检查VIP是否过期
    const now = new Date()
    const vipExpireDate = vipStatus[0]?.vipExpireDate
    const isVipActive = vipStatus[0]?.isVip && vipExpireDate && vipExpireDate > now
    const isVip = isVipActive || user.role === 'vip'
    const aiDailyLimit = isVip ? 100 : 10

    // 获取用户创建的漫画数量
    const comicCountRes = await db
      .select({ count: count() })
      .from(comics)
      .where(eq(comics.authorId, userId))
    const comicCount = comicCountRes[0]?.count || 0

    // 获取用户收藏数量
    const favoriteCountRes = await db
      .select({ count: count() })
      .from(comicFavorites)
      .where(eq(comicFavorites.userId, userId))
    const favoriteCount = favoriteCountRes[0]?.count || 0

    // 获取用户点赞的漫画数量
    const likedComicCountRes = await db
      .select({ count: count() })
      .from(comicLikes)
      .where(eq(comicLikes.userId, userId))
    const likedComicCount = likedComicCountRes[0]?.count || 0

    // 获取用户所有漫画的总浏览量
    const viewCountRes = await db
      .select({ sum: sql`SUM(${comics.viewCount})` })
      .from(comics)
      .where(eq(comics.authorId, userId))
    const viewCount = Number(viewCountRes[0]?.sum) || 0

    // 获取用户获得的点赞数量
    const receivedLikeCountRes = await db
      .select({ count: count() })
      .from(comicLikes)
      .innerJoin(comics, eq(comicLikes.comicId, comics.id))
      .where(eq(comics.authorId, userId))
    const receivedLikeCount = receivedLikeCountRes[0]?.count || 0

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      joinDate: user.createdAt,
      isVip,
      vipExpireDate: vipStatus[0]?.vipExpireDate,
      aiUsageCount,
      aiDailyLimit,
      comicCount,
      favoriteCount,
      viewCount,
      likedComicCount,
      receivedLikeCount,
    }

    return NextResponse.json(userProfile)

  } catch (error) {
    console.error('获取用户资料失败:', error)
    return NextResponse.json(
      { error: '获取用户资料失败' },
      { status: 500 },
    )
  }
}

// PUT /api/user/profile - 更新用户个人资料
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const { username, email, bio, avatar } = body

    // 验证必填字段
    if (!username || !email) {
      return NextResponse.json(
        { error: '用户名和邮箱为必填字段' },
        { status: 400 },
      )
    }

    // 更新用户资料
    await db
      .update(users)
      .set({
        name: username,
        email,
        avatar,
        updated_at: new Date(),
      })
      .where(eq(users.id, session.user.id))

    return NextResponse.json({
      message: '个人资料更新成功',
    })

  } catch (error) {
    console.error('更新用户资料失败:', error)
    return NextResponse.json(
      { error: '更新用户资料失败' },
      { status: 500 },
    )
  }
}
