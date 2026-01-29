import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { coupletCollaborations, coupletCollaborationParticipants } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const collaborationId = parseInt(id)
    const body = await request.json()
    const { userId, contribution, contributionType, step, notes } = body

    if (isNaN(collaborationId)) {
      return NextResponse.json(
        { success: false, message: '无效的协作ID' },
        { status: 400 }
      )
    }

    if (!userId || !contribution || !contributionType) {
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

    if (collaborationData.status !== 'ongoing') {
      return NextResponse.json(
        { success: false, message: '协作项目不在进行阶段' },
        { status: 400 }
      )
    }

    // 检查用户是否是参与者
    const participant = await db
      .select()
      .from(coupletCollaborationParticipants)
      .where(
        and(
          eq(coupletCollaborationParticipants.collaborationId, collaborationId),
          eq(coupletCollaborationParticipants.userId, userId)
        )
      )
      .limit(1)

    if (participant.length === 0) {
      return NextResponse.json(
        { success: false, message: '你不是该协作项目的参与者' },
        { status: 403 }
      )
    }

    // 更新参与者的贡献
    const updatedParticipant = await db
      .update(coupletCollaborationParticipants)
      .set({
        contribution,
        contributionType,
        step: step || collaborationData.currentStep
      })
      .where(
        and(
          eq(coupletCollaborationParticipants.collaborationId, collaborationId),
          eq(coupletCollaborationParticipants.userId, userId)
        )
      )
      .returning()

    return NextResponse.json({
      success: true,
      data: updatedParticipant[0],
      message: '贡献提交成功'
    })

  } catch (error) {
    console.error('提交贡献失败:', error)
    return NextResponse.json(
      { success: false, message: '提交贡献失败' },
      { status: 500 }
    )
  }
}