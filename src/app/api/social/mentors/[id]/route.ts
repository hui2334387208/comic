import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { mentorProfiles, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

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

    // 获取导师详细信息
    const mentor = await db
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
        language: mentorProfiles.language,
        createdAt: mentorProfiles.createdAt,
        userName: users.name,
        userUsername: users.username,
        userAvatar: users.avatar,
      })
      .from(mentorProfiles)
      .leftJoin(users, eq(mentorProfiles.userId, users.id))
      .where(eq(mentorProfiles.id, mentorId))
      .limit(1)

    if (mentor.length === 0) {
      return NextResponse.json(
        { success: false, message: '导师不存在' },
        { status: 404 }
      )
    }

    const mentorData = mentor[0]

    // 计算经验年数
    const experienceYears = mentorData.createdAt 
      ? Math.floor((Date.now() - new Date(mentorData.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365))
      : 0

    // 格式化可用时间
    let availabilityText = '需预约'
    if (mentorData.availability) {
      try {
        const availabilityData = typeof mentorData.availability === 'string' 
          ? JSON.parse(mentorData.availability) 
          : mentorData.availability
        
        if (availabilityData && typeof availabilityData === 'object') {
          availabilityText = availabilityData.description || '需预约'
        }
      } catch (e) {
        availabilityText = '需预约'
      }
    }

    // 格式化专长领域
    let expertiseList = []
    if (mentorData.expertise) {
      try {
        expertiseList = typeof mentorData.expertise === 'string' 
          ? JSON.parse(mentorData.expertise) 
          : mentorData.expertise
        
        if (!Array.isArray(expertiseList)) {
          expertiseList = []
        }
      } catch (e) {
        expertiseList = []
      }
    }

    // 格式化成就
    let achievementsList = []
    if (mentorData.achievements) {
      try {
        achievementsList = typeof mentorData.achievements === 'string' 
          ? JSON.parse(mentorData.achievements) 
          : mentorData.achievements
        
        if (!Array.isArray(achievementsList)) {
          achievementsList = []
        }
      } catch (e) {
        achievementsList = []
      }
    }

    // 格式化语言列表
    const languages = mentorData.language ? [mentorData.language === 'zh' ? '中文' : mentorData.language] : ['中文']

    const mentorDetail = {
      id: mentorData.id,
      name: mentorData.userName || mentorData.userUsername || '未知导师',
      title: mentorData.title || '导师',
      avatar: mentorData.userAvatar || '👨‍🎓',
      rating: mentorData.rating || 0,
      students: mentorData.totalStudents || 0,
      activeStudents: mentorData.activeStudents || 0,
      maxStudents: mentorData.maxStudents || 10,
      experience: `${Math.max(experienceYears, 1)}年`,
      status: mentorData.status || 'active',
      expertise: expertiseList,
      achievements: achievementsList,
      bio: mentorData.bio || '暂无简介',
      hourlyRate: mentorData.hourlyRate ? Math.floor(mentorData.hourlyRate / 100) : 0,
      availability: availabilityText,
      verificationStatus: mentorData.verificationStatus || 'pending',
      specialties: mentorData.bio || '暂无特色介绍',
      totalSessions: 0, // TODO: 从实际数据计算
      completedSessions: 0, // TODO: 从实际数据计算
      responseTime: '24小时内', // TODO: 从实际数据计算
      languages: languages,
      teachingStyle: mentorData.bio || '暂无教学风格介绍',
      successRate: mentorData.rating || 0
    }

    return NextResponse.json({
      success: true,
      data: mentorDetail
    })

  } catch (error) {
    console.error('获取导师详情失败:', error)
    return NextResponse.json(
      { success: false, message: '获取导师详情失败' },
      { status: 500 }
    )
  }
}