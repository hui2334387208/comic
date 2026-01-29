import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/db';
import { 
  courses, 
  lessons, 
  exercises, 
  learningPaths, 
  educationBadges 
} from '@/db/schema';
import initEducationData from '@/data/init-education-data.json';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    // TODO: 检查管理员权限
    // 这里应该添加管理员权限检查逻辑

    console.log('开始初始化教育数据...');

    // 1. 初始化课程数据
    const courseResults = [];
    const courseTitleToIdMap = new Map();
    
    for (const courseData of initEducationData.courses) {
      try {
        // 先转换prerequisites从课程标题到ID
        const prerequisiteIds = [];
        if (courseData.prerequisites && courseData.prerequisites.length > 0) {
          for (const prereqTitle of courseData.prerequisites) {
            const prereqId = courseTitleToIdMap.get(prereqTitle);
            if (prereqId) {
              prerequisiteIds.push(prereqId);
            }
          }
        }

        const [course] = await db.insert(courses).values({
          title: courseData.title,
          description: courseData.description,
          level: courseData.level,
          category: courseData.category,
          duration: courseData.duration,
          order: courseData.order,
          isPublished: courseData.isPublished,
          prerequisites: prerequisiteIds.length > 0 ? prerequisiteIds : null,
          learningObjectives: courseData.learningObjectives
        }).returning();
        
        courseResults.push(course);
        courseTitleToIdMap.set(course.title, course.id);
        console.log(`创建课程: ${course.title}`);
      } catch (error) {
        console.error(`创建课程失败: ${courseData.title}`, error);
      }
    }

    // 2. 初始化练习题数据
    const exerciseResults = [];
    for (const exerciseData of initEducationData.exercises) {
      try {
        const [exercise] = await db.insert(exercises).values({
          type: exerciseData.type,
          title: exerciseData.title,
          question: exerciseData.question,
          options: exerciseData.options || null,
          correctAnswer: exerciseData.correctAnswer,
          explanation: exerciseData.explanation,
          hints: exerciseData.hints,
          difficulty: exerciseData.difficulty,
          points: exerciseData.points,
          timeLimit: exerciseData.timeLimit,
          tags: exerciseData.tags,
          isDaily: exerciseData.isDaily
        }).returning();
        
        exerciseResults.push(exercise);
        console.log(`创建练习题: ${exercise.title}`);
      } catch (error) {
        console.error(`创建练习题失败: ${exerciseData.title}`, error);
      }
    }

    // 3. 初始化学习路径数据
    const pathResults = [];
    for (const pathData of initEducationData.learningPaths) {
      try {
        // 查找对应的课程ID
        const courseIds = [];
        for (const courseTitle of pathData.courseIds) {
          const courseId = courseTitleToIdMap.get(courseTitle);
          if (courseId) {
            courseIds.push(courseId);
          }
        }

        const [path] = await db.insert(learningPaths).values({
          name: pathData.name,
          description: pathData.description,
          level: pathData.level,
          estimatedDuration: pathData.estimatedDuration,
          courseIds: courseIds,
          prerequisites: pathData.prerequisites,
          learningGoals: pathData.learningGoals,
          isRecommended: pathData.isRecommended
        }).returning();
        
        pathResults.push(path);
        console.log(`创建学习路径: ${path.name}`);
      } catch (error) {
        console.error(`创建学习路径失败: ${pathData.name}`, error);
      }
    }

    // 4. 初始化教育徽章数据
    const badgeResults = [];
    for (const badgeData of initEducationData.educationBadges) {
      try {
        const [badge] = await db.insert(educationBadges).values({
          name: badgeData.name,
          description: badgeData.description,
          icon: badgeData.icon,
          color: badgeData.color,
          category: badgeData.category,
          requirement: badgeData.requirement,
          rarity: badgeData.rarity,
          isActive: true
        }).returning();
        
        badgeResults.push(badge);
        console.log(`创建教育徽章: ${badge.name}`);
      } catch (error) {
        console.error(`创建教育徽章失败: ${badgeData.name}`, error);
      }
    }

    console.log('教育数据初始化完成');

    return NextResponse.json({
      success: true,
      message: '教育数据初始化成功',
      data: {
        courses: courseResults.length,
        exercises: exerciseResults.length,
        learningPaths: pathResults.length,
        badges: badgeResults.length
      }
    });

  } catch (error) {
    console.error('初始化教育数据失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '初始化教育数据失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 获取初始化状态
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    // 检查各个表的数据量
    const courseCount = await db.select().from(courses);
    const exerciseCount = await db.select().from(exercises);
    const pathCount = await db.select().from(learningPaths);
    const badgeCount = await db.select().from(educationBadges);

    return NextResponse.json({
      success: true,
      data: {
        courses: courseCount.length,
        exercises: exerciseCount.length,
        learningPaths: pathCount.length,
        badges: badgeCount.length,
        isInitialized: courseCount.length > 0 && exerciseCount.length > 0
      }
    });

  } catch (error) {
    console.error('获取初始化状态失败:', error);
    return NextResponse.json(
      { success: false, message: '获取初始化状态失败' },
      { status: 500 }
    );
  }
}