import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { permissions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    // 权限检查
    const permissionCheck = await requirePermission('permission.read')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await params

    const permission = await db.query.permissions.findFirst({
      where: eq(permissions.id, id)
    })

    if (!permission) {
      return NextResponse.json({ error: '权限不存在' }, { status: 404 })
    }

    await logger.info({
      module: 'admin',
      action: 'get_permission_detail',
      description: `管理员查看权限详情: ${permission.name}`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: permission
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'get_permission_detail_error',
      description: `获取权限详情时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '获取权限详情失败' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    // 权限检查
    const permissionCheck = await requirePermission('permission.update')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, displayName, description, module, action, resource } = body

    // 检查权限是否存在
    const existingPermission = await db.query.permissions.findFirst({
      where: eq(permissions.id, id)
    })

    if (!existingPermission) {
      return NextResponse.json({ error: '权限不存在' }, { status: 404 })
    }

    // 不能修改系统权限
    if (existingPermission.isSystem) {
      return NextResponse.json({ error: '不能修改系统权限' }, { status: 400 })
    }

    // 如果要修改权限名称，检查是否已被使用
    if (name && name !== existingPermission.name) {
      const nameExists = await db.query.permissions.findFirst({
        where: eq(permissions.name, name)
      })

      if (nameExists) {
        return NextResponse.json({ error: '权限名称已被使用' }, { status: 400 })
      }
    }

    // 更新权限
    const updatedPermission = await db
      .update(permissions)
      .set({
        name: name || existingPermission.name,
        displayName: displayName || existingPermission.displayName,
        description: description !== undefined ? description : existingPermission.description,
        module: module || existingPermission.module,
        action: action || existingPermission.action,
        resource: resource !== undefined ? resource : existingPermission.resource,
        updated_at: new Date()
      })
      .where(eq(permissions.id, id))
      .returning()

    await logger.info({
      module: 'admin',
      action: 'update_permission',
      description: `管理员更新权限: ${existingPermission.name}`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: updatedPermission[0]
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'update_permission_error',
      description: `更新权限时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '更新权限失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    // 权限检查
    const permissionCheck = await requirePermission('permission.delete')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await params

    // 检查权限是否存在
    const existingPermission = await db.query.permissions.findFirst({
      where: eq(permissions.id, id)
    })

    if (!existingPermission) {
      return NextResponse.json({ error: '权限不存在' }, { status: 404 })
    }

    // 不能删除系统权限
    if (existingPermission.isSystem) {
      return NextResponse.json({ error: '不能删除系统权限' }, { status: 400 })
    }

    // 删除权限
    await db.delete(permissions).where(eq(permissions.id, id))

    await logger.info({
      module: 'admin',
      action: 'delete_permission',
      description: `管理员删除权限: ${existingPermission.name}`,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      message: '权限删除成功'
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'delete_permission_error',
      description: `删除权限时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '删除权限失败' },
      { status: 500 }
    )
  }
}
