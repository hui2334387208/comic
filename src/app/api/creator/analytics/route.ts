import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { comics } from '@/db/schema'
import { eq, and, gte, sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'

    // 计算日期范围
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 获取用户的所有作品
    const userComics = await db
      .select()
      .from(comics)
      .where(eq(comics.authorId, parseInt(session.user.id)))

    // 计算统计数据
    const totalViews = userComics.reduce((sum, comic) => sum + (comic.viewCount || 0), 0)
    const totalLikes = userComics.reduce((sum, comic) => sum + (comic.likeCount || 0), 0)
    const totalFavorites = userComics.reduce((sum, comic) => sum + (comic.favoriteCount || 0), 0)

    // 模拟今日数据（实际应该从日志表查询）
    const todayViews = Math.floor(totalViews * 0.05)
    const todayLikes = Math.floor(totalLikes * 0.05)
    const todayFavorites = Math.floor(totalFavorites * 0.05)

    // 计算增长率（模拟）
    const growthRate = Math.floor(Math.random() * 20) - 5

    // 获取热门作品
    const topWorks = userComics
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 10)
      .map(comic => ({
        id: comic.id,
        title: comic.title,
        viewCount: comic.viewCount || 0,
        likeCount: comic.likeCount || 0,
        favoriteCount: comic.favoriteCount || 0,
      }))

    // 生成趋势图数据（模拟）
    const chartData = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      chartData.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        value: Math.floor(Math.random() * 1000) + 500,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          todayViews,
          todayLikes,
          todayFavorites,
          growthRate,
          totalViews,
          totalLikes,
          totalFavorites,
          totalComments: 0, // TODO: 从评论表查询
        },
        topWorks,
        chartData,
      },
    })
  } catch (error) {
    console.error('获取分析数据失败:', error)
    return NextResponse.json({ success: false, error: '获取数据失败' }, { status: 500 })
  }
}
