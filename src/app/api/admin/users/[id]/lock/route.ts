import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    // 权限检查
    const permissionCheck = await requirePermission('user.update')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { reason, expiresAt } = body

    // 检查用户是否存在
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, id)
    })

    if (!existingUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 不能锁定自己
    if (id === session.user.id) {
      return NextResponse.json({ error: '不能锁定自己的账户' }, { status: 400 })
    }

    // 锁定用户
    const updatedUser = await db
      .update(users)
      .set({
        isLocked: true,
        lockReason: reason || '管理员操作',
        lockedAt: new Date(),
        lockExpiresAt: expiresAt ? new Date(expiresAt) : null,
        updated_at: new Date()
      })
      .where(eq(users.id, id))
      .returning()

    await logger.info({
      module: 'admin',
      action: 'lock_user',
      description: `管理员锁定用户: ${existingUser.email}, 原因: ${reason || '管理员操作'}`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: updatedUser[0],
      message: '用户锁定成功'
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'lock_user_error',
      description: `锁定用户时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '锁定用户失败' },
      { status: 500 }
    )
  }
}
