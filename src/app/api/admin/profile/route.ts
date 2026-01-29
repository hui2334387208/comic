import bcrypt from 'bcryptjs'
import { eq, and, ne } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { users } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'
import { logger } from '@/lib/logger'
import { changePasswordRateLimit } from '@/lib/rate-limit'
import { requirePermission } from '@/lib/permission-middleware'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    // 权限检查
    const permissionCheck = await requirePermission('user.read')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { name, email, currentPassword, newPassword, avatar } = body

    // 获取当前用户信息
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 如果要修改用户名，检查是否已被使用
    if (name && name !== user.username) {
      const existingUser = await db.query.users.findFirst({
        where: and(
          eq(users.username, name),
          ne(users.id, userId),
        ),
      })

      if (existingUser) {
        return NextResponse.json({ error: '用户名已被使用' }, { status: 400 })
      }
    }

    // 如果要修改邮箱，检查是否已被使用
    if (email && email !== user.email) {
      const existingUser = await db.query.users.findFirst({
        where: and(
          eq(users.email, email),
          ne(users.id, userId),
        ),
      })

      if (existingUser) {
        return NextResponse.json({ error: '邮箱已被使用' }, { status: 400 })
      }
    }

    // 如果要修改密码，验证当前密码
    if (newPassword) {
      // 频率限制检查
      const rateLimitResult = changePasswordRateLimit(request as any)
      if (!rateLimitResult.allowed) {
        await logger.warning({
          module: 'auth',
          action: 'change-password',
          description: `修改密码被限制：频率过高 (IP: ${request.headers.get('x-forwarded-for') || 'unknown'})`,
        })
        return NextResponse.json(
          { 
            error: `修改过于频繁，请稍后再试`,
            retryAfter: rateLimitResult.retryAfter
          },
          { 
            status: 429,
            headers: {
              'Retry-After': rateLimitResult.retryAfter?.toString() || '600'
            }
          },
        )
      }

      if (!currentPassword) {
        return NextResponse.json({ error: '请输入当前密码' }, { status: 400 })
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password ?? '')
      if (!isPasswordValid) {
        return NextResponse.json({ error: '当前密码错误' }, { status: 400 })
      }
    }

    // 更新用户信息
    const updateData: any = {}
    if (name) updateData.username = name
    if (email) updateData.email = email
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 10)
    }
    if (avatar) updateData.avatar = avatar
    updateData.updated_at = new Date()

    await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))

    await logger.info({
      module: 'admin',
      action: 'update_profile',
      description: `用户更新个人信息 (${session.user.email})`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('更新个人信息失败:', error)
    await logger.error({
      module: 'admin',
      action: 'update_profile',
      description: `更新个人信息失败：${error instanceof Error ? error.message : '未知错误'}`,
    })
    return NextResponse.json({ error: '更新个人信息失败' }, { status: 500 })
  }
}
