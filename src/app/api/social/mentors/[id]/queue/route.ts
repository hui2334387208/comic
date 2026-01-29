import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { mentorProfiles, mentorStudentRelations } from '@/db/schema'
import { eq, and, count } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const mentorId = parseInt(id)

    if (isNaN(mentorId)) {
      return NextResponse.json(
        { success: false, message: '无效的导师ID' },
        { status: 400 }
      )
    }

    // 获取排队信息（模拟数据）
    const queueInfo = {
      position: Math.floor(Math.random() * 10) + 1,
      estimatedWaitTime: '2-3天',
      totalInQueue: Math.floor(Math.random() * 15) + 5
    }

    return NextResponse.json({
      success: true,
      data: queueInfo
    })

  } catch (error) {
    console.error('获取排队信息失败:', error)
    return NextResponse.json(
      { success: false, message: '获取排队信息失败' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const mentorId = parseInt(id)
    const body = await request.json()
    const { studentId, message, urgency, preferredTime, contactMethod } = body

    if (isNaN(mentorId)) {
      return NextResponse.json(
        { success: false, message: '无效的导师ID' },
        { status: 400 }
      )
    }

    if (!studentId || !message) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 检查导师是否存在
    const mentor = await db
      .select({
        id: mentorProfiles.id,
        userId: mentorProfiles.userId,
        status: mentorProfiles.status,
        activeStudents: mentorProfiles.activeStudents,
        maxStudents: mentorProfiles.maxStudents
      })
      .from(mentorProfiles)
      .where(eq(mentorProfiles.id, mentorId))
      .limit(1)

    if (mentor.length === 0) {
      return NextResponse.json(
        { success: false, message: '导师不存在' },
        { status: 404 }
      )
    }

    const mentorData = mentor[0]

    // 检查是否已经有关系记录
    const existingRelation = await db
      .select()
      .from(mentorStudentRelations)
      .where(
        and(
          eq(mentorStudentRelations.mentorId, mentorData.userId),
          eq(mentorStudentRelations.studentId, studentId)
        )
      )
      .limit(1)

    if (existingRelation.length > 0) {
      return NextResponse.json(
        { success: false, message: '你已经申请过该导师的指导' },
        { status: 400 }
      )
    }

    // 创建排队记录（使用师生关系表，状态为pending表示排队中）
    const queueRecord = await db.insert(mentorStudentRelations).values({
      mentorId: mentorData.userId,
      studentId,
      status: 'pending',
      notes: JSON.stringify({
        type: 'queue',
        message,
        urgency,
        preferredTime,
        contactMethod,
        queuedAt: new Date().toISOString()
      })
    }).returning()

    return NextResponse.json({
      success: true,
      data: queueRecord[0],
      message: '成功加入排队，导师有空时会联系你'
    })

  } catch (error) {
    console.error('加入排队失败:', error)
    return NextResponse.json(
      { success: false, message: '加入排队失败' },
      { status: 500 }
    )
  }
}