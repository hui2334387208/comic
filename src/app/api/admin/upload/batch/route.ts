import { del, list } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/authOptions'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/lib/permission-middleware'

// 批量删除图片
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    // 权限检查
    const permissionCheck = await requirePermission('resource.delete')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { urls } = await request.json()
    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: '没有提供图片URL' }, { status: 400 })
    }

    // 过滤掉无效的URL
    const validUrls = urls.filter((url): url is string =>
      typeof url === 'string' && url.startsWith('https://'),
    )

    if (validUrls.length === 0) {
      return NextResponse.json({ error: '没有有效的图片URL' }, { status: 400 })
    }

    // 获取所有已存在的blob
    const { blobs } = await list()
    const existingUrls = new Set(blobs.map(blob => blob.url))

    // 批量删除图片
    const results = await Promise.allSettled(
      validUrls.map(async (url) => {
        try {
          // 检查URL是否存在
          if (!existingUrls.has(url)) {
            return { url, success: false, error: '图片不存在' }
          }

          await del(url)
          return { url, success: true }
        } catch (error) {
          return {
            url,
            success: false,
            error: error instanceof Error ? error.message : '未知错误',
          }
        }
      }),
    )

    // 统计成功和失败的数量
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failCount = results.length - successCount

    await logger.info({
      module: 'admin',
      action: 'delete_files_batch',
      description: `批量删除文件完成：成功 ${successCount} 个，失败 ${failCount} 个`,
    })

    return NextResponse.json({
      success: true,
      total: results.length,
      successCount,
      failCount,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { url: r.reason, success: false }),
    })
  } catch (error) {
    console.error('批量删除文件失败:', error)
    await logger.error({
      module: 'admin',
      action: 'delete_files_batch',
      description: `批量删除文件失败：${error instanceof Error ? error.message : '未知错误'}`,
    })
    return NextResponse.json({ error: '批量删除文件失败' }, { status: 500 })
  }
}
