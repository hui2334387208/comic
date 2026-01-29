import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { permissions } from '@/db/schema'
import { eq } from 'drizzle-orm'
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

    const permissionsList = await db.query.permissions.findMany({
      orderBy: (permissions, { desc }) => [desc(permissions.created_at)]
    })

    await logger.info({
      module: 'admin',
      action: 'get_permissions',
      description: '管理员获取权限列表',
    })

    return NextResponse.json({
      success: true,
      data: permissionsList
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'get_permissions_error',
      description: `获取权限列表时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '获取权限列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('permission.create')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const { name, displayName, description, module, action, resource } = body

    // 验证必填字段
    if (!name || !displayName || !module || !action) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    // 检查权限名称是否已存在
    const existingPermission = await db.query.permissions.findFirst({
      where: eq(permissions.name, name)
    })

    if (existingPermission) {
      return NextResponse.json({ error: '权限名称已存在' }, { status: 400 })
    }

    // 创建权限
    const newPermission = await db.insert(permissions).values({
      id: crypto.randomUUID(),
      name,
      displayName,
      description,
      module,
      action,
      resource,
      created_at: new Date(),
      updated_at: new Date()
    }).returning()

    await logger.info({
      module: 'admin',
      action: 'create_permission',
      description: `管理员创建权限: ${name}`,
    })

    return NextResponse.json({
      success: true,
      data: newPermission[0]
    })

  } catch (error) {
    await logger.error({
      module: 'admin',
      action: 'create_permission_error',
      description: `创建权限时出错: ${error}`,
    })

    return NextResponse.json(
      { error: '创建权限失败' },
      { status: 500 }
    )
  }
}
