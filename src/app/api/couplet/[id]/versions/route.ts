import { eq, desc } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { couplets, coupletVersions, coupletContents } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'
import { publicApiRateLimit } from '@/lib/rate-limit'
import { fetchCoupletVersions } from '@/lib/couplet-utils'

// GET /api/couplet/[id]/versions - 获取对联的所有版本
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = publicApiRateLimit(request)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: '请求过于频繁，请稍后再试' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter ?? Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
          },
        },
      )
    }

    const { id } = await context.params
    const coupletId = parseInt(id)

    if (isNaN(coupletId)) {
      return NextResponse.json(
        { success: false, message: '无效的对联ID' },
        { status: 400 },
      )
    }

    const result = await fetchCoupletVersions(coupletId)

    if (!result) {
      return NextResponse.json(
        { success: false, message: '对联不存在' },
        { status: 404 },
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('获取对联版本失败:', error)
    return NextResponse.json(
      { success: false, message: '获取对联版本失败' },
      { status: 500 },
    )
  }
}

// POST /api/couplet/[id]/versions - 创建新版本
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 },
      )
    }

    const { id } = await context.params
    const coupletId = parseInt(id)
    const body = await request.json()
    const { versionDescription, contents } = body

    if (isNaN(coupletId)) {
      return NextResponse.json(
        { success: false, message: '无效的对联ID' },
        { status: 400 },
      )
    }

    // 检查用户是否有权限编辑这个对联
    const coupletData = await db
      .select({ authorId: couplets.authorId })
      .from(couplets)
      .where(eq(couplets.id, coupletId))
      .limit(1)

    if (coupletData.length === 0) {
      return NextResponse.json(
        { success: false, message: '对联不存在' },
        { status: 404 },
      )
    }

    if (coupletData[0].authorId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: '无权限编辑此对联' },
        { status: 403 },
      )
    }

    // 获取当前最新版本号
    const latestVersion = await db
      .select({ version: coupletVersions.version })
      .from(coupletVersions)
      .where(eq(coupletVersions.coupletId, coupletId))
      .orderBy(desc(coupletVersions.version))
      .limit(1)

    const newVersionNumber = latestVersion.length > 0 ? latestVersion[0].version + 1 : 1

    // 使用事务创建新版本
    const result = await db.transaction(async (tx) => {
      // 将当前版本标记为非最新
      await tx
        .update(coupletVersions)
        .set({ isLatestVersion: false })
        .where(eq(coupletVersions.coupletId, coupletId))

      // 创建新版本记录
      const [newVersion] = await tx
        .insert(coupletVersions)
        .values({
          coupletId,
          version: newVersionNumber,
          parentVersionId: coupletId,
          versionDescription: versionDescription || `版本 ${newVersionNumber}`,
          isLatestVersion: true,
          originalCoupletId: coupletId,
        })
        .returning()

      // 复制内容到新版本
      if (contents && contents.length > 0) {
        const contentData = contents.map((content: any, index: number) => ({
          coupletId,
          versionId: newVersion.id,
          upperLine: content.upperLine || content.title || '',
          lowerLine: content.lowerLine || content.description || '',
          horizontalScroll: content.horizontalScroll || content.startDate || '',
          orderIndex: index,
        }))

        await tx.insert(coupletContents).values(contentData)
      }

      return newVersion
    })

    return NextResponse.json({
      success: true,
      data: {
        version: result,
        message: '新版本创建成功',
      },
    })

  } catch (error) {
    console.error('创建对联版本失败:', error)
    return NextResponse.json(
      { success: false, message: '创建对联版本失败' },
      { status: 500 },
    )
  }
}

