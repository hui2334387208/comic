import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { mentorProfiles, mentorStudentRelations, users } from '@/db/schema'
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
      whereCondition = eq(mentorProfiles.status, status)
    }

    // 获取导师列表
    const mentors = await db
      .select({
        id: mentorProfiles.id,
        userId: mentorProfiles.userId,
        title: mentorProfiles.title,
        bio: mentorProfiles.bio,
        expertise: mentorProfiles.expertise,
        experience: mentorProfiles.experience,
        achievements: mentorProfiles.achievements,
        rating: mentorProfiles.rating,
        totalStudents: mentorProfiles.totalStudents,
        activeStudents: mentorProfiles.activeStudents,
        maxStudents: mentorProfiles.maxStudents,
        hourlyRate: mentorProfiles.hourlyRate,
        availability: mentorProfiles.availability,
        status: mentorProfiles.status,
        verificationStatus: mentorProfiles.verificationStatus,
        verifiedAt: mentorProfiles.verifiedAt,
        language: mentorProfiles.language,
        createdAt: mentorProfiles.createdAt,
        userName: users.name,
        userUsername: users.username,
        userEmail: users.email,
        userAvatar: users.avatar,
      })
      .from(mentorProfiles)
      .leftJoin(users, eq(mentorProfiles.userId, users.id))
      .where(whereCondition)
      .orderBy(desc(mentorProfiles.rating))
      .limit(limit)
      .offset(offset)

    // 获取总数
    const totalResult = await db
      .select({ count: count() })
      .from(mentorProfiles)
      .where(whereCondition)

    const total = totalResult[0]?.count || 0

    // 为每个导师计算经验年数和格式化数据
    const mentorsWithDetails = mentors.map(mentor => {
      // 计算经验年数
      const experienceYears = mentor.createdAt 
        ? Math.floor((Date.now() - new Date(mentor.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365))
        : 0

      // 格式化可用时间
      let availabilityText = '需预约'
      if (mentor.availability) {
        try {
          const availabilityData = typeof mentor.availability === 'string' 
            ? JSON.parse(mentor.availability) 
            : mentor.availability
          
          if (availabilityData && typeof availabilityData === 'object') {
            // 这里可以根据实际的availability数据结构来格式化
            availabilityText = availabilityData.description || '需预约'
          }
        } catch (e) {
          availabilityText = '需预约'
        }
      }

      // 格式化专长领域
      let expertiseList = []
      if (mentor.expertise) {
        try {
          expertiseList = typeof mentor.expertise === 'string' 
            ? JSON.parse(mentor.expertise) 
            : mentor.expertise
          
          if (!Array.isArray(expertiseList)) {
            expertiseList = []
          }
        } catch (e) {
          expertiseList = []
        }
      }

      // 格式化成就
      let achievementsList = []
      if (mentor.achievements) {
        try {
          achievementsList = typeof mentor.achievements === 'string' 
            ? JSON.parse(mentor.achievements) 
            : mentor.achievements
          
          if (!Array.isArray(achievementsList)) {
            achievementsList = []
          }
        } catch (e) {
          achievementsList = []
        }
      }

      return {
        id: mentor.id,
        name: mentor.userName || mentor.userUsername || '未知导师',
        title: mentor.title || '导师',
        avatar: mentor.userAvatar || '👨‍🎓',
        rating: mentor.rating || 0,
        students: mentor.totalStudents || 0,
        activeStudents: mentor.activeStudents || 0,
        maxStudents: mentor.maxStudents || 10,
        experience: `${Math.max(experienceYears, 1)}年`,
        status: mentor.status || 'active',
        expertise: expertiseList,
        achievements: achievementsList,
        bio: mentor.bio || '暂无简介',
        hourlyRate: mentor.hourlyRate ? Math.floor(mentor.hourlyRate / 100) : 0, // 转换为元
        availability: availabilityText,
        verificationStatus: mentor.verificationStatus || 'pending',
        specialties: mentor.bio || '暂无特色介绍'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        mentors: mentorsWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('获取导师列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取导师列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      title,
      bio,
      expertise = [],
      experience,
      achievements = [],
      hourlyRate,
      availability,
      maxStudents = 10,
      language = 'zh'
    } = body

    // 验证必填字段
    if (!userId || !title) {
      return NextResponse.json(
        { success: false, message: '用户ID和导师头衔为必填项' },
        { status: 400 }
      )
    }

    // 检查用户是否已经是导师
    const existingMentor = await db
      .select()
      .from(mentorProfiles)
      .where(eq(mentorProfiles.userId, userId))
      .limit(1)

    if (existingMentor.length > 0) {
      return NextResponse.json(
        { success: false, message: '该用户已经是导师' },
        { status: 400 }
      )
    }

    // 创建导师档案
    const newMentor = await db.insert(mentorProfiles).values({
      userId,
      title,
      bio,
      expertise: JSON.stringify(expertise),
      experience,
      achievements: JSON.stringify(achievements),
      hourlyRate: hourlyRate ? hourlyRate * 100 : null, // 转换为分
      availability: JSON.stringify(availability),
      maxStudents,
      language,
      status: 'active',
      verificationStatus: 'pending',
      rating: 0,
      totalStudents: 0,
      activeStudents: 0
    }).returning()

    return NextResponse.json({
      success: true,
      data: newMentor[0],
      message: '导师申请提交成功，等待审核'
    })

  } catch (error) {
    console.error('申请成为导师失败:', error)
    return NextResponse.json(
      { success: false, message: '申请成为导师失败' },
      { status: 500 }
    )
  }
}