import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { coupletCollaborations, coupletCollaborationParticipants, users } from '@/db/schema'
import { eq, desc, count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // 构建查询条件
    let whereCondition = undefined
    if (status && status !== 'all') {
      whereCondition = eq(coupletCollaborations.status, status)
    }

    // 获取协作项目列表
    const collaborations = await db
      .select({
        id: coupletCollaborations.id,
        title: coupletCollaborations.title,
        description: coupletCollaborations.description,
        theme: coupletCollaborations.theme,
        status: coupletCollaborations.status,
        maxCollaborators: coupletCollaborations.maxCollaborators,
        currentCollaborators: coupletCollaborations.currentCollaborators,
        collaborationType: coupletCollaborations.collaborationType,
        timeLimit: coupletCollaborations.timeLimit,
        currentStep: coupletCollaborations.currentStep,
        totalSteps: coupletCollaborations.totalSteps,
        rules: coupletCollaborations.rules,
        isPublic: coupletCollaborations.isPublic,
        language: coupletCollaborations.language,
        createdAt: coupletCollaborations.createdAt,
        creatorName: users.name,
        creatorUsername: users.username,
      })
      .from(coupletCollaborations)
      .leftJoin(users, eq(coupletCollaborations.creatorId, users.id))
      .where(whereCondition)
      .orderBy(desc(coupletCollaborations.createdAt))
      .limit(limit)
      .offset(offset)

    // 获取总数
    const totalResult = await db
      .select({ count: count() })
      .from(coupletCollaborations)
      .where(whereCondition)

    const total = totalResult[0]?.count || 0

    // 为每个协作项目获取参与者信息
    const collaborationsWithParticipants = await Promise.all(
      collaborations.map(async (collab) => {
        // 获取参与者列表
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
          .where(eq(coupletCollaborationParticipants.collaborationId, collab.id))
          .orderBy(coupletCollaborationParticipants.joinedAt)

        // 计算进度
        const progress = Math.round(((collab.currentStep || 1) / (collab.totalSteps || 3)) * 100)

        // 获取当前步骤描述
        const stepDescriptions = ['准备阶段', '上联创作', '下联创作', '横批创作', '完善润色']
        const currentStepDesc = stepDescriptions[(collab.currentStep || 1) - 1] || '未知阶段'

        return {
          ...collab,
          creator: collab.creatorName || collab.creatorUsername || '未知用户',
          progress,
          currentStepDesc,
          participants: participants.map(p => ({
            ...p,
            user: p.userName || p.userUsername || '未知用户'
          }))
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        collaborations: collaborationsWithParticipants,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('获取协作项目列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取协作项目列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      theme,
      creatorId,
      maxCollaborators = 5,
      collaborationType = 'sequential',
      timeLimit = 86400,
      totalSteps = 3,
      rules,
      isPublic = true,
      language = 'zh'
    } = body

    // 验证必填字段
    if (!title || !creatorId) {
      return NextResponse.json(
        { success: false, message: '标题和创建者ID为必填项' },
        { status: 400 }
      )
    }

    // 创建新协作项目
    const newCollaboration = await db.insert(coupletCollaborations).values({
      title,
      description,
      theme,
      creatorId,
      maxCollaborators,
      collaborationType,
      timeLimit,
      totalSteps,
      rules,
      isPublic,
      language,
      status: 'recruiting',
      currentCollaborators: 1,
      currentStep: 1
    }).returning()

    // 创建者自动加入协作
    await db.insert(coupletCollaborationParticipants).values({
      collaborationId: newCollaboration[0].id,
      userId: creatorId,
      role: 'creator',
      status: 'active'
    })

    return NextResponse.json({
      success: true,
      data: newCollaboration[0],
      message: '协作项目创建成功'
    })

  } catch (error) {
    console.error('创建协作项目失败:', error)
    return NextResponse.json(
      { success: false, message: '创建协作项目失败' },
      { status: 500 }
    )
  }
}