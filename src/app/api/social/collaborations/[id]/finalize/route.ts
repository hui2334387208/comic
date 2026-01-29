import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { coupletCollaborations, couplets, coupletContents, coupletVersions } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const collaborationId = parseInt(id)
    const body = await request.json()
    const { finalWork, notes, userId } = body

    if (isNaN(collaborationId)) {
      return NextResponse.json(
        { success: false, message: '无效的协作ID' },
        { status: 400 }
      )
    }

    if (!userId || !finalWork || !finalWork.upperLine || !finalWork.lowerLine) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 检查协作项目是否存在且状态正确
    const collaboration = await db
      .select()
      .from(coupletCollaborations)
      .where(eq(coupletCollaborations.id, collaborationId))
      .limit(1)

    if (collaboration.length === 0) {
      return NextResponse.json(
        { success: false, message: '协作项目不存在' },
        { status: 404 }
      )
    }

    const collaborationData = collaboration[0]

    if (collaborationData.status !== 'finalizing') {
      return NextResponse.json(
        { success: false, message: '协作项目不在完善阶段' },
        { status: 400 }
      )
    }

    // 创建最终对联作品
    const newCouplet = await db.insert(couplets).values({
      title: `${finalWork.upperLine} ${finalWork.lowerLine}`,
      slug: `collaboration-${collaborationId}-${Date.now()}`,
      description: `协作创作作品：${collaborationData.title}`,
      authorId: collaborationData.creatorId,
      isPublic: true,
    }).returning()

    // 创建对联版本
    const newVersion = await db.insert(coupletVersions).values({
      coupletId: newCouplet[0].id,
      version: 1,
      isLatestVersion: true,
    }).returning()

    // 创建对联内容
    await db.insert(coupletContents).values({
      coupletId: newCouplet[0].id,
      versionId: newVersion[0].id,
      upperLine: finalWork.upperLine,
      lowerLine: finalWork.lowerLine,
      horizontalScroll: finalWork.horizontalScroll || null,
    })

    // 更新协作项目状态
    const updatedCollaboration = await db
      .update(coupletCollaborations)
      .set({
        status: 'completed',
        coupletId: newCouplet[0].id,
        updatedAt: new Date()
      })
      .where(eq(coupletCollaborations.id, collaborationId))
      .returning()

    return NextResponse.json({
      success: true,
      data: {
        collaboration: updatedCollaboration[0],
        couplet: newCouplet[0]
      },
      message: '作品完善成功，协作项目已完成'
    })

  } catch (error) {
    console.error('完善作品失败:', error)
    return NextResponse.json(
      { success: false, message: '完善作品失败' },
      { status: 500 }
    )
  }
}