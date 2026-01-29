import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { mentorProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      title,
      bio,
      expertise,
      experience,
      achievements,
      maxStudents,
      hourlyRate,
      availability
    } = body

    // 验证必填字段
    if (!title || !bio || !expertise || expertise.length === 0) {
      return NextResponse.json(
        { success: false, message: '请填写所有必填字段' },
        { status: 400 }
      )
    }

    // 检查是否已经申请过
    const existingProfile = await db
      .select()
      .from(mentorProfiles)
      .where(eq(mentorProfiles.userId, session.user.id))
      .limit(1)

    if (existingProfile.length > 0) {
      return NextResponse.json(
        { success: false, message: '您已经提交过导师申请' },
        { status: 400 }
      )
    }

    // 创建导师档案
    const newProfile = await db.insert(mentorProfiles).values({
      userId: session.user.id,
      title,
      bio,
      expertise: JSON.stringify(expertise),
      experience,
      achievements: JSON.stringify(achievements || []),
      maxStudents: maxStudents || 10,
      hourlyRate: hourlyRate || 0,
      availability: JSON.stringify({ description: availability }),
      status: 'inactive',
      verificationStatus: 'pending'
    }).returning()

    return NextResponse.json({
      success: true,
      data: newProfile[0],
      message: '导师申请提交成功，请等待审核'
    })

  } catch (error) {
    console.error('提交导师申请失败:', error)
    return NextResponse.json(
      { success: false, message: '提交导师申请失败' },
      { status: 500 }
    )
  }
}