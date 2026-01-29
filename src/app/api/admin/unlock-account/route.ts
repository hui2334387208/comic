import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { unlockAccount } from '@/lib/account-lock'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function POST(request: NextRequest) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('user.update')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { email, reason } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: '请提供邮箱地址' },
        { status: 400 }
      )
    }

    // 解锁账户
    await unlockAccount(email, reason || '管理员手动解锁')

    await logger.info({
      module: 'admin',
      action: 'unlock_account',
      description: `管理员解锁账户: ${email}`,
      userId: session.user.id
    })

    return NextResponse.json({ 
      success: true,
      message: '账户解锁成功'
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'unlock_account_error',
      description: `解锁账户时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '解锁账户时发生错误' },
      { status: 500 }
    )
  }
}
