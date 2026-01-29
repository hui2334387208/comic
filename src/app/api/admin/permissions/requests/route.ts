import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { permissionRequests, roles, users } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(request: NextRequest) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('permission.read')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const requests = await db
      .select({
        id: permissionRequests.id,
        userId: permissionRequests.userId,
        roleId: permissionRequests.roleId,
        reason: permissionRequests.reason,
        status: permissionRequests.status,
        reviewedBy: permissionRequests.reviewedBy,
        reviewedAt: permissionRequests.reviewedAt,
        reviewComment: permissionRequests.reviewComment,
        created_at: permissionRequests.created_at,
        userName: users.name,
        userEmail: users.email,
        roleName: roles.displayName
      })
      .from(permissionRequests)
      .leftJoin(users, eq(permissionRequests.userId, users.id))
      .leftJoin(roles, eq(permissionRequests.roleId, roles.id))
      .orderBy(desc(permissionRequests.created_at))

    await logger.info({
      module: 'admin',
      action: 'get_permission_requests',
      description: '管理员获取权限请求列表',
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: requests
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'get_permission_requests_error',
      description: `获取权限请求列表时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '获取权限请求列表失败' },
      { status: 500 }
    )
  }
}
