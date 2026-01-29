import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { resources } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

// 获取资源列表
export async function GET(request: NextRequest) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('resource.read')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const resourceList = await db.select().from(resources).orderBy(resources.createdAt)
    return NextResponse.json(resourceList)
  } catch (error) {
    console.error('获取资源列表失败:', error)
    await logger.error({
      module: 'admin',
      action: 'list_resource',
      description: `获取资源列表失败：${error instanceof Error ? error.message : '未知错误'}`,
    })
    return NextResponse.json({ error: '获取资源列表失败' }, { status: 500 })
  }
}

// 上传资源
export async function POST(request: NextRequest) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('resource.create')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type')
    
    // 检查是否为JSON格式（分片上传后的数据）
    if (contentType?.includes('application/json')) {
      const resourceData = await request.json()
      
      if (!resourceData.name || !resourceData.url) {
        return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
      }

      // 直接保存资源信息到数据库
      const [newResource] = await db.insert(resources).values(resourceData).returning()

      await logger.info({
        module: 'admin',
        action: 'upload_resource',
        description: `上传资源成功：${resourceData.name}`,
      })

      return NextResponse.json(newResource)
    } else {
      // 原有的FormData处理逻辑（兼容性保留）
      const formData = await request.formData()
      const file = formData.get('file') as File
      const type = formData.get('type') as string

      if (!file) {
        await logger.warning({
          module: 'admin',
          action: 'upload_resource',
          description: '上传资源失败：没有上传文件',
        })
        return NextResponse.json({ error: '没有上传文件' }, { status: 400 })
      }

      // 构造新的 formData
      const newFormData = new FormData()
      newFormData.append('file', file)
      newFormData.append('type', type)

      // 调用统一上传接口
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/upload`, {
        method: 'POST',
        body: newFormData,
        headers: {
          'Cookie': request.headers.get('cookie') || '',
        },
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '上传失败')
      }

      const data = await res.json()

      // 保存资源信息到数据库
      const resourceData = {
        name: file.name,
        url: data.url,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.type,
      }
      const [newResource] = await db.insert(resources).values(resourceData).returning()

      await logger.info({
        module: 'admin',
        action: 'upload_resource',
        description: `上传资源成功：${file.name}`,
      })

      return NextResponse.json(newResource)
    }
  } catch (error) {
    console.error('上传资源失败:', error)
    await logger.error({
      module: 'admin',
      action: 'upload_resource',
      description: `上传资源失败：${error instanceof Error ? error.message : '未知错误'}`,
    })
    return NextResponse.json({ error: '上传资源失败' }, { status: 500 })
  }
}

// 删除资源
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: '缺少资源ID' }, { status: 400 })
    }

    // 获取资源信息
    const resource = await db.query.resources.findFirst({
      where: (resources, { eq }) => eq(resources.id, id),
    })

    if (!resource) {
      return NextResponse.json({ error: '资源不存在' }, { status: 404 })
    }

    // 删除资源
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/upload`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({ url: resource.url }),
    })

    if (!res.ok) {
      throw new Error('删除资源失败')
    }

    // 删除数据库记录
    await db.delete(resources).where(eq(resources.id, id))

    await logger.info({
      module: 'admin',
      action: 'delete_resource',
      description: `删除资源成功：${resource.name}`,
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
