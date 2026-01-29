import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { mentorStudentRelations, mentorProfiles } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// 申请指导
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await request.json()
    const { mentorUserId, message } = body

    // 检查导师是否存在
    const mentor = await db
      .select()
      .from(mentorProfiles)
      .where(eq(mentorProfiles.userId, mentorUserId))
      .limit(1)

    if (mentor.length === 0) {
      return NextResponse.json(
        { success: false, message: '导师不存在' },
        { status: 404 }
      )
    }

    if (mentor[0].status !== 'active') {
      return NextResponse.json(
        { success: false, message: '导师当前不可预约' },
        { status: 400 }
      )
    }

    if ((mentor[0].activeStudents || 0) >= (mentor[0].maxStudents || 0)) {
      return NextResponse.json(
        { success: false, message: '导师学生已满' },
        { status: 400 }
      )
    }

    // 检查是否已经申请过
    const existingRelation = await db
      .select()
      .from(mentorStudentRelations)
      .where(and(
        eq(mentorStudentRelations.mentorId, mentorUserId),
        eq(mentorStudentRelations.studentId, userId),
        eq(mentorStudentRelations.status, 'pending')
      ))
      .limit(1)

    if (existingRelation.length > 0) {
      return NextResponse.json(
        { success: false, message: '您已经申请过了，请等待导师回复' },
        { status: 400 }
      )
    }

    // 创建师生关系申请
    const newRelation = await db.insert(mentorStudentRelations).values({
      mentorId: mentorUserId,
      studentId: userId,
      status: 'pending',
      notes: message
    }).returning()

    return NextResponse.json({
      success: true,
      data: newRelation[0],
      message: '申请已提交，请等待导师回复'
    })

  } catch (error) {
    console.error('申请指导失败:', error)
    return NextResponse.json(
      { success: false, message: '申请指导失败' },
      { status: 500 }
    )
  }
}