import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { mentorStudentRelations, mentorProfiles } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const mentorId = parseInt(id)
    const body = await request.json()
    const { studentId, message, goals, experience, availability, expectations } = body

    if (isNaN(mentorId)) {
      return NextResponse.json(
        { success: false, message: '无效的导师ID' },
        { status: 400 }
      )
    }

    if (!studentId || !message || !goals) {
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

    // 检查导师状态
    if (mentorData.status !== 'active') {
      return NextResponse.json(
        { success: false, message: '导师当前不接受新学生' },
        { status: 400 }
      )
    }

    // 检查学生容量
    if ((mentorData.activeStudents || 0) >= (mentorData.maxStudents || 0)) {
      return NextResponse.json(
        { success: false, message: '导师学生已满' },
        { status: 400 }
      )
    }

    // 检查是否已经申请过
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

    // 创建师生关系申请
    const newRelation = await db.insert(mentorStudentRelations).values({
      mentorId: mentorData.userId,
      studentId,
      status: 'pending',
      notes: JSON.stringify({
        message,
        goals,
        experience,
        availability,
        expectations
      })
    }).returning()

    return NextResponse.json({
      success: true,
      data: newRelation[0],
      message: '申请提交成功，请等待导师回复'
    })

  } catch (error) {
    console.error('申请导师指导失败:', error)
    return NextResponse.json(
      { success: false, message: '申请导师指导失败' },
      { status: 500 }
    )
  }
}