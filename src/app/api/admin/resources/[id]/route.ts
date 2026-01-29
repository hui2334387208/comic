import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { logger } from '@/lib/logger'
import { db } from '@/db'
import { resources } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requirePermission } from '@/lib/permission-middleware'

// 删除单个资源
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('resource.delete')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: '缺少资源ID' }, { status: 400 })
    }

    // 获取资源信息
    const resource = await db.query.resources.findFirst({
      where: (resources, { eq }) => eq(resources.id, parseInt(id)),
    })

    if (!resource) {
      return NextResponse.json({ error: '资源不存在' }, { status: 404 })
    }

    // 删除Vercel Blob中的文件
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/upload`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({ url: resource.url }),
    })

    if (!res.ok) {
      console.error('删除文件失败:', await res.text())
      // 即使文件删除失败，也继续删除数据库记录
    }

    // 删除数据库记录
    await db.delete(resources).where(eq(resources.id, parseInt(id)))

    await logger.info({
      module: 'admin',
      action: 'delete_resource',
      description: `删除资源成功：${resource.name}`,
      userId: session.user.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除资源失败:', error)
    await logger.error({
      module: 'admin',
      action: 'delete_resource',
      description: `删除资源失败：${error instanceof Error ? error.message : '未知错误'}`,
    })
    return NextResponse.json({ error: '删除资源失败' }, { status: 500 })
  }
}