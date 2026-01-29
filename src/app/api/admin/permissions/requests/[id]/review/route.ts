import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { permissionRequests, userRoles, roles } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('permission.update')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, comment } = body

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: '无效的状态' }, { status: 400 })
    }

    // 检查请求是否存在
    const permissionRequest = await db.query.permissionRequests.findFirst({
      where: eq(permissionRequests.id, id)
    })

    if (!permissionRequest) {
      return NextResponse.json({ error: '请求不存在' }, { status: 404 })
    }

    if (permissionRequest.status !== 'pending') {
      return NextResponse.json({ error: '请求已被处理' }, { status: 400 })
    }

    // 更新请求状态
    await db
      .update(permissionRequests)
      .set({
        status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewComment: comment,
        updated_at: new Date()
      })
      .where(eq(permissionRequests.id, id))

    // 如果批准，分配角色给用户
    if (status === 'approved') {
      // 检查用户是否已经有这个角色
      const existingUserRole = await db.query.userRoles.findFirst({
        where: and(
          eq(userRoles.userId, permissionRequest.userId),
          eq(userRoles.roleId, permissionRequest.roleId)
        )
      })

      if (!existingUserRole) {
        await db.insert(userRoles).values({
          id: crypto.randomUUID(),
          userId: permissionRequest.userId,
          roleId: permissionRequest.roleId,
          assignedBy: session.user.id!,
          assignedAt: new Date(),
          isActive: true,
          priority: 0,
          created_at: new Date(),
          updated_at: new Date()
        })
      }
    }

    await logger.info({
      module: 'admin',
      action: 'review_permission_request',
      description: `管理员${status === 'approved' ? '批准' : '拒绝'}权限请求: ${id}`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      message: status === 'approved' ? '请求已批准' : '请求已拒绝'
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'review_permission_request_error',
      description: `审核权限请求时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '审核权限请求失败' },
      { status: 500 }
    )
  }
}
