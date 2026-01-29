import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { coupletCollaborations, coupletCollaborationParticipants, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const collaborationId = parseInt(id)

    if (isNaN(collaborationId)) {
      return NextResponse.json(
        { success: false, message: '无效的协作ID' },
        { status: 400 }
      )
    }

    // 获取协作基本信息
    const collaboration = await db
      .select({
        id: coupletCollaborations.id,
        title: coupletCollaborations.title,
        description: coupletCollaborations.description,
        theme: coupletCollaborations.theme,
        status: coupletCollaborations.status,
        maxCollaborators: coupletCollaborations.maxCollaborators,
        currentCollaborators: coupletCollaborations.currentCollaborators,
        collaborationType: coupletCollaborations.collaborationType,
        currentStep: coupletCollaborations.currentStep,
        totalSteps: coupletCollaborations.totalSteps,
        rules: coupletCollaborations.rules,
        createdAt: coupletCollaborations.createdAt,
        creatorName: users.name,
        creatorUsername: users.username,
      })
      .from(coupletCollaborations)
      .leftJoin(users, eq(coupletCollaborations.creatorId, users.id))
      .where(eq(coupletCollaborations.id, collaborationId))
      .limit(1)

    if (collaboration.length === 0) {
      return NextResponse.json(
        { success: false, message: '协作项目不存在' },
        { status: 404 }
      )
    }

    // 获取参与者信息
    const participants = await db
      .select({
        id: coupletCollaborationParticipants.id,
        userId: coupletCollaborationParticipants.userId,
        role: coupletCollaborationParticipants.role,
        contribution: coupletCollaborationParticipants.contribution,
        contributionType: coupletCollaborationParticipants.contributionType,
        step: coupletCollaborationParticipants.step,
        status: coupletCollaborationParticipants.status,
        joinedAt: coupletCollaborationParticipants.joinedAt,
        userName: users.name,
        userUsername: users.username,
      })
      .from(coupletCollaborationParticipants)
      .leftJoin(users, eq(coupletCollaborationParticipants.userId, users.id))
      .where(eq(coupletCollaborationParticipants.collaborationId, collaborationId))
      .orderBy(coupletCollaborationParticipants.joinedAt)

    const collaborationData = collaboration[0]

    // 计算进度
    const progress = Math.round(((collaborationData.currentStep || 1) / (collaborationData.totalSteps || 3)) * 100)

    // 获取当前步骤描述
    const stepDescriptions = ['准备阶段', '上联创作', '下联创作', '横批创作', '完善润色']
    const currentStepDesc = stepDescriptions[(collaborationData.currentStep || 1) - 1] || '未知阶段'

    const collaborationDetail = {
      ...collaborationData,
      creator: collaborationData.creatorName || collaborationData.creatorUsername || '未知用户',
      progress,
      currentStepDesc,
      participants: participants.map(p => ({
        ...p,
        user: p.userName || p.userUsername || '未知用户'
      })),
      rules: collaborationData.rules ? (typeof collaborationData.rules === 'string' ? collaborationData.rules : JSON.stringify(collaborationData.rules)) : ''
    }

    return NextResponse.json({
      success: true,
      data: collaborationDetail
    })

  } catch (error) {
    console.error('获取协作详情失败:', error)
    return NextResponse.json(
      { success: false, message: '获取协作详情失败' },
      { status: 500 }
    )
  }
}