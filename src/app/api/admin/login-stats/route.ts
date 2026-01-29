import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getLoginFrequencyStats } from '@/lib/success-login-detection'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(request: NextRequest) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('user.read')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: '请提供邮箱地址' },
        { status: 400 }
      )
    }

    // 获取登录频率统计
    const stats = await getLoginFrequencyStats(email)

    if (!stats) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    await logger.info({
      module: 'admin',
      action: 'get_login_stats',
      description: `管理员查看登录统计: ${email}`,
      userId: session.user.id
    })

    return NextResponse.json({ 
      success: true,
      data: stats
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'get_login_stats_error',
      description: `获取登录统计时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '获取登录统计时发生错误' },
      { status: 500 }
    )
  }
}
