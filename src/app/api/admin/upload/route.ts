import { put, del, list } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/authOptions'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

// 上传类型定义
type UploadType =
  | 'article'    // 文章封面
  | 'banner'     // 轮播图
  | 'image'      // 通用图片
  | 'case'       // 案例图片
  | 'product'    // 产品图片
  | 'video'      // 视频
  | 'avatar';    // 用户头像

// 文件大小限制（单位：MB）
const FILE_SIZE_LIMITS: Record<UploadType, number> = {
  article: 5,
  banner: 5,
  image: 5,
  case: 5,
  product: 5,
  video: 100,
  avatar: 5,
}

// 上传文件
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    // 权限检查
    const permissionCheck = await requirePermission('resource.create')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as UploadType

    if (!file) {
      return NextResponse.json({ error: '没有上传文件' }, { status: 400 })
    }

    if (!type || !Object.keys(FILE_SIZE_LIMITS).includes(type)) {
      return NextResponse.json({ error: '无效的上传类型' }, { status: 400 })
    }

    // 验证文件类型
    if (type === 'video') {
      if (!file.type.startsWith('video/')) {
        return NextResponse.json({ error: '只支持上传视频文件' }, { status: 400 })
      }
    } else {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: '只支持上传图片文件' }, { status: 400 })
      }
    }

    // 验证文件大小
    const sizeLimit = FILE_SIZE_LIMITS[type] * 1024 * 1024
    if (file.size > sizeLimit) {
      return NextResponse.json(
        { error: `文件大小不能超过 ${FILE_SIZE_LIMITS[type]}MB` },
        { status: 400 },
      )
    }

    // 生成唯一文件名
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop()
    const filename = `${type}/${timestamp}-${randomString}.${extension}`

    // 上传到 Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    await logger.info({
      module: 'admin',
      action: 'upload_file',
      description: `文件上传成功：${filename}`,
    })

    return NextResponse.json({
      url: blob.url,
      filename,
      type,
      size: file.size,
      contentType: file.type,
    })
  } catch (error) {
    console.error('上传文件失败:', error)
    await logger.error({
      module: 'admin',
      action: 'upload_file',
      description: `文件上传失败：${error instanceof Error ? error.message : '未知错误'}`,
    })
    return NextResponse.json({ error: '上传文件失败' }, { status: 500 })
  }
}

// 删除单个文件
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    // 权限检查
    const permissionCheck = await requirePermission('resource.create')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { url } = await request.json()
    if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
      return NextResponse.json({ error: '无效的文件URL' }, { status: 400 })
    }

    // 检查URL是否存在
    try {
      const { blobs } = await list()
      const exists = blobs.some(blob => blob.url === url)

      if (!exists) {
        return NextResponse.json({
          error: '文件不存在',
          url,
        }, { status: 404 })
      }

      // 删除文件
      await del(url)

      await logger.info({
        module: 'admin',
        action: 'delete_file',
        description: `删除文件成功：${url}`,
      })

      return NextResponse.json({
        success: true,
        url,
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json({
          error: '文件不存在',
          url,
        }, { status: 404 })
      }
      throw error
    }
  } catch (error) {
    console.error('删除文件失败:', error)
    await logger.error({
      module: 'admin',
      action: 'delete_file',
      description: `删除文件失败：${error instanceof Error ? error.message : '未知错误'}`,
    })
    return NextResponse.json({ error: '删除文件失败' }, { status: 500 })
  }
}
