import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/db';
import { courses, lessons, userProgress } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// 获取课程详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const courseId = parseInt(id);

    if (isNaN(courseId)) {
      return NextResponse.json(
        { success: false, message: '无效的课程ID' },
        { status: 400 }
      );
    }

    // 获取课程基本信息
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId));
    
    if (!course) {
      return NextResponse.json(
        { success: false, message: '课程不存在' },
        { status: 404 }
      );
    }

    // 获取课程章节
    const courseLessons = await db.select({
      id: lessons.id,
      title: lessons.title,
      content: lessons.content,
      videoUrl: lessons.videoUrl,
      order: lessons.order,
      duration: lessons.duration,
      isPreview: lessons.isPreview,
      // 如果用户已登录，获取学习进度
      progress: session?.user?.id ? 
        sql<number>`COALESCE((
          SELECT ${userProgress.progress}
          FROM ${userProgress}
          WHERE ${userProgress.userId} = ${session.user.id}
          AND ${userProgress.lessonId} = ${lessons.id}
        ), 0)` : sql<number>`0`,
      status: session?.user?.id ? 
        sql<string>`COALESCE((
          SELECT ${userProgress.status}
          FROM ${userProgress}
          WHERE ${userProgress.userId} = ${session.user.id}
          AND ${userProgress.lessonId} = ${lessons.id}
        ), 'not_started')` : sql<string>`'not_started'`
    }).from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(lessons.order);

    // 计算整体进度
    let overallProgress = 0;
    if (session?.user?.id && courseLessons.length > 0) {
      const [progressResult] = await db.select({
        avgProgress: sql<number>`COALESCE(AVG(CAST(${userProgress.progress} AS DECIMAL)), 0)`
      }).from(userProgress)
        .where(and(
          eq(userProgress.userId, session.user.id),
          eq(userProgress.courseId, courseId)
        ));
      
      overallProgress = progressResult?.avgProgress || 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...course,
        lessons: courseLessons,
        overallProgress,
        totalLessons: courseLessons.length,
        completedLessons: courseLessons.filter(l => l.status === 'completed').length
      }
    });
  } catch (error) {
    console.error('获取课程详情失败:', error);
    return NextResponse.json(
      { success: false, message: '获取课程详情失败' },
      { status: 500 }
    );
  }
}

// 更新课程（管理员）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    // TODO: 检查管理员权限

    const { id } = await params;
    const courseId = parseInt(id);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { success: false, message: '无效的课程ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    const [updatedCourse] = await db.update(courses)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(courses.id, courseId))
      .returning();

    if (!updatedCourse) {
      return NextResponse.json(
        { success: false, message: '课程不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCourse,
      message: '课程更新成功'
    });
  } catch (error) {
    console.error('更新课程失败:', error);
    return NextResponse.json(
      { success: false, message: '更新课程失败' },
      { status: 500 }
    );
  }
}

// 删除课程（管理员）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    // TODO: 检查管理员权限

    const { id } = await params;
    const courseId = parseInt(id);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { success: false, message: '无效的课程ID' },
        { status: 400 }
      );
    }
    
    await db.delete(courses).where(eq(courses.id, courseId));

    return NextResponse.json({
      success: true,
      message: '课程删除成功'
    });
  } catch (error) {
    console.error('删除课程失败:', error);
    return NextResponse.json(
      { success: false, message: '删除课程失败' },
      { status: 500 }
    );
  }
}