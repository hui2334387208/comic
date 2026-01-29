import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, and, gte, lte, count, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    // 权限检查
    const permissionCheck = await requirePermission('user.read')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 获取基本统计
    const basicStats = await db
      .select({
        totalUsers: count(),
        lockedUsers: count(users.isLocked)
      })
      .from(users)

    // 活跃用户（30天内登录过）
    const activeUsers = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.isLocked, false),
          gte(users.lastSuccessfulLoginAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        )
      )

    // 今日新增用户
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const newUsersToday = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          gte(users.created_at, today),
          lte(users.created_at, tomorrow)
        )
      )

    // 本周新增用户
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const newUsersThisWeek = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.created_at, weekAgo))

    // 本月新增用户
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const newUsersThisMonth = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.created_at, monthAgo))

    // 角色分布
    const roleDistribution = await db
      .select({
        role: users.role,
        count: count()
      })
      .from(users)
      .groupBy(users.role)

    // 最近7天每日新增用户
    const dailyNewUsers = await db
      .select({
        date: sql<string>`DATE(${users.created_at})`,
        count: count()
      })
      .from(users)
      .where(gte(users.created_at, weekAgo))
      .groupBy(sql`DATE(${users.created_at})`)
      .orderBy(sql`DATE(${users.created_at})`)

    const stats = {
      totalUsers: basicStats[0]?.totalUsers || 0,
      activeUsers: activeUsers[0]?.count || 0,
      lockedUsers: basicStats[0]?.lockedUsers || 0,
      newUsersToday: newUsersToday[0]?.count || 0,
      newUsersThisWeek: newUsersThisWeek[0]?.count || 0,
      newUsersThisMonth: newUsersThisMonth[0]?.count || 0,
      roleDistribution: roleDistribution.reduce((acc, item) => {
        acc[item.role] = item.count
        return acc
      }, {} as Record<string, number>),
      dailyNewUsers: dailyNewUsers.map(item => ({
        date: item.date,
        count: item.count
      }))
    }

    await logger.info({
      module: 'admin',
      action: 'get_user_stats',
      description: '管理员获取用户统计',
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'get_user_stats_error',
      description: `获取用户统计时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '获取用户统计失败' },
      { status: 500 }
    )
  }
}
