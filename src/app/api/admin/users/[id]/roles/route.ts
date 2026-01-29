import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { userRoles, roles } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { requirePermission } from '@/lib/permission-middleware'

// 获取用户角色列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: userId } = await params

    // 获取用户角色
    const userRolesData = await db
      .select({
        id: userRoles.id,
        roleId: userRoles.roleId,
        roleName: roles.name,
        roleDisplayName: roles.displayName,
        assignedBy: userRoles.assignedBy,
        assignedAt: userRoles.assignedAt,
        expiresAt: userRoles.expiresAt,
        isActive: userRoles.isActive,
        priority: userRoles.priority,
        reason: userRoles.reason
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId))
      .orderBy(desc(userRoles.assignedAt))

    return NextResponse.json({
      success: true,
      data: userRolesData
    })
  } catch (error) {
    console.error('Error fetching user roles:', error)
    return NextResponse.json({ error: '获取用户角色失败' }, { status: 500 })
  }
}

// 为用户分配角色
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: userId } = await params
    const { roleId, expiresAt, reason, priority = 0 } = await request.json()

    if (!roleId) {
      return NextResponse.json({ error: '角色ID不能为空' }, { status: 400 })
    }

    // 检查角色是否存在
    const role = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1)

    if (!role.length) {
      return NextResponse.json({ error: '角色不存在' }, { status: 404 })
    }

    // 检查是否已经分配了该角色
    const existingRole = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, roleId),
          eq(userRoles.isActive, true)
        )
      )
      .limit(1)

    if (existingRole.length > 0) {
      return NextResponse.json({ error: '用户已拥有该角色' }, { status: 400 })
    }

    // 分配角色
    const newUserRole = {
      id: `ur_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      roleId,
      assignedBy: session.user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      reason,
      priority
    }

    await db.insert(userRoles).values(newUserRole)

    return NextResponse.json({
      success: true,
      message: '角色分配成功',
      data: newUserRole
    })
  } catch (error) {
    console.error('Error assigning role:', error)
    return NextResponse.json({ error: '分配角色失败' }, { status: 500 })
  }
}
