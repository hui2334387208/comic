import { NextRequest, NextResponse } from 'next/server'
import { and, eq, desc } from 'drizzle-orm'

import { db } from '@/db'
import { couplets, coupletContents, coupletVersions } from '@/db/schema'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const coupletId = parseInt(id)

    if (isNaN(coupletId)) {
      return NextResponse.json(
        { success: false, message: '无效的对联ID' },
        { status: 400 },
      )
    }

    const body = await request.json()
    const { contents = [], versionId } = body || {}

    if (!Array.isArray(contents)) {
      return NextResponse.json(
        { success: false, message: 'contents 参数必须为数组' },
        { status: 400 },
      )
    }

    // 确认对联存在
    const coupletExists = await db
      .select({ id: couplets.id })
      .from(couplets)
      .where(eq(couplets.id, coupletId))
      .limit(1)

    if (coupletExists.length === 0) {
      return NextResponse.json(
        { success: false, message: '对联不存在' },
        { status: 404 },
      )
    }

    // 解析目标版本
    let targetVersionId: number
    if (versionId && Number.isFinite(Number(versionId))) {
      targetVersionId = Number(versionId)
    } else {
      const latest = await db
        .select({ id: coupletVersions.id })
        .from(coupletVersions)
        .where(eq(coupletVersions.coupletId, coupletId))
        .orderBy(desc(coupletVersions.version))
        .limit(1)

      if (latest.length === 0) {
        // 若不存在版本，创建一个初始版本
        const [newVersion] = await db
          .insert(coupletVersions)
          .values({
            coupletId,
            version: 1,
            parentVersionId: null,
            versionDescription: '初始化',
            isLatestVersion: true,
            originalCoupletId: coupletId,
          })
          .returning()
        targetVersionId = newVersion.id
      } else {
        targetVersionId = latest[0].id
      }
    }

    // 事务：先清空再写入
    await db.transaction(async (tx) => {
      await tx
        .delete(coupletContents)
        .where(and(eq(coupletContents.coupletId, coupletId), eq(coupletContents.versionId, targetVersionId)))

      if (contents.length > 0) {
        const values = contents.map((content: any, index: number) => ({
          coupletId,
          versionId: targetVersionId,
          upperLine: content.upperLine || content.title || '上联',
          lowerLine: content.lowerLine || content.description || '下联',
          horizontalScroll: content.horizontalScroll || content.category || content.startDate || '横批',
          appreciation: content.appreciation || '',
          orderIndex: index,
        }))
        
        try {
          await tx.insert(coupletContents).values(values)
        } catch (error: any) {
          // 如果插入失败（可能是因为appreciation字段不存在），回退到不包含appreciation的插入
          if (error.message && error.message.includes('appreciation')) {
            console.warn('插入包含appreciation字段失败，回退到基础插入:', error.message)
            const basicValues = values.map(({ appreciation, ...rest }) => rest)
            await tx.insert(coupletContents).values(basicValues)
          } else {
            throw error
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { coupletId, versionId: targetVersionId, totalContents: contents.length },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '更新内容失败', detail: (error as any)?.message },
      { status: 500 },
    )
  }
}

