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
    const { userId, message, skills, availability, expectations } = body

    if (isNaN(collaborationId)) {
      return NextResponse.json(
        { success: false, message: '无效的协作ID' },
        { status: 400 }
      )
    }

    if (!userId || !message) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 检查协作项目是否存在
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

    // 检查协作状态
    if (collaborationData.status !== 'recruiting') {
      return NextResponse.json(
        { success: false, message: '协作项目不在招募阶段' },
        { status: 400 }
      )
    }

    // 检查人数限制
    if ((collaborationData.currentCollaborators || 0) >= (collaborationData.maxCollaborators || 0)) {
      return NextResponse.json(
        { success: false, message: '协作人数已满' },
        { status: 400 }
      )
    }

    // 检查是否已经参与
    const existingParticipant = await db
      .select()
      .from(coupletCollaborationParticipants)
      .where(
        and(
          eq(coupletCollaborationParticipants.collaborationId, collaborationId),
          eq(coupletCollaborationParticipants.userId, userId)
        )
      )
      .limit(1)

    if (existingParticipant.length > 0) {
      return NextResponse.json(
        { success: false, message: '你已经参与了该协作项目' },
        { status: 400 }
      )
    }

    // 添加参与者
    const newParticipant = await db.insert(coupletCollaborationParticipants).values({
      collaborationId,
      userId,
      role: 'collaborator',
      status: 'active'
    }).returning()

    // 更新协作项目的参与者数量
    await db
      .update(coupletCollaborations)
      .set({ 
        currentCollaborators: (collaborationData.currentCollaborators || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(coupletCollaborations.id, collaborationId))

    return NextResponse.json({
      success: true,
      data: newParticipant[0],
      message: '成功加入协作项目'
    })

  } catch (error) {
    console.error('加入协作失败:', error)
    return NextResponse.json(
      { success: false, message: '加入协作失败' },
      { status: 500 }
    )
  }
}