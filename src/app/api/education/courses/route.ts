import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/db';
import { courses, userProgress, lessons } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

// 获取课程列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // 添加筛选条件
    const conditions = [eq(courses.isPublished, true)];
    if (level) conditions.push(eq(courses.level, level));
    if (category) conditions.push(eq(courses.category, category));

    const result = await db.select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      level: courses.level,
      category: courses.category,
      coverImage: courses.coverImage,
      duration: courses.duration,
      order: courses.order,
      learningObjectives: courses.learningObjectives,
      createdAt: courses.createdAt,
      // 计算课程进度（如果用户已登录）
      progress: session?.user?.id ? 
        sql<number>`COALESCE((
          SELECT AVG(CAST(${userProgress.progress} AS DECIMAL))
          FROM ${userProgress}
          WHERE ${userProgress.userId} = ${session.user.id}
          AND ${userProgress.courseId} = ${courses.id}
        ), 0)` : sql<number>`0`,
      // 计算章节数
      lessonCount: sql<number>`(
        SELECT COUNT(*)
        FROM ${lessons}
        WHERE ${lessons.courseId} = ${courses.id}
      )`
    }).from(courses)
      .where(and(...conditions))
      .orderBy(courses.order, desc(courses.createdAt))
      .limit(limit)
      .offset(offset);

    // 获取总数
    const [{ count: total }] = await db.select({ count: sql<number>`count(*)` })
      .from(courses)
      .where(and(...conditions));

    return NextResponse.json({
      success: true,
      data: {
        courses: result,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取课程列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取课程列表失败' },
      { status: 500 }
    );
  }
}

// 创建新课程（管理员）
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    // 检查管理员权限
    // TODO: 添加权限检查逻辑

    const body = await request.json();
    const {
      title,
      description,
      level,
      category,
      coverImage,
      duration,
      order,
      prerequisites,
      learningObjectives
    } = body;

    if (!title || !level || !category) {
      return NextResponse.json(
        { success: false, message: '标题、级别和分类为必填项' },
        { status: 400 }
      );
    }

    const [course] = await db.insert(courses).values({
      title,
      description,
      level,
      category,
      coverImage,
      duration,
      order: order || 0,
      prerequisites: prerequisites || [],
      learningObjectives: learningObjectives || [],
      isPublished: false
    }).returning();

    return NextResponse.json({
      success: true,
      data: course,
      message: '课程创建成功'
    });
  } catch (error) {
    console.error('创建课程失败:', error);
    return NextResponse.json(
      { success: false, message: '创建课程失败' },
      { status: 500 }
    );
  }
}