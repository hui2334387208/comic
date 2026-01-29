import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/db';
import { exercises, dailyPractice, userProgress, learningStats } from '@/db/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';

// 获取每日练习题
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 检查今日是否已有练习记录
    const [todayPractice] = await db.select()
      .from(dailyPractice)
      .where(and(
        eq(dailyPractice.userId, userId),
        gte(dailyPractice.date, today),
        lte(dailyPractice.date, tomorrow)
      ));

    let dailyExercises;
    let practiceRecord = todayPractice;

    if (todayPractice) {
      // 获取已分配的练习题
      dailyExercises = await db.select({
        id: exercises.id,
        type: exercises.type,
        title: exercises.title,
        question: exercises.question,
        options: exercises.options,
        hints: exercises.hints,
        difficulty: exercises.difficulty,
        points: exercises.points,
        timeLimit: exercises.timeLimit,
        // 获取用户完成状态
        completed: sql<boolean>`EXISTS(
          SELECT 1 FROM ${userProgress}
          WHERE ${userProgress.userId} = ${userId}
          AND ${userProgress.exerciseId} = ${exercises.id}
          AND ${userProgress.status} = 'completed'
          AND DATE(${userProgress.completedAt}) = DATE(${today})
        )`,
        score: sql<number>`COALESCE((
          SELECT ${userProgress.score}
          FROM ${userProgress}
          WHERE ${userProgress.userId} = ${userId}
          AND ${userProgress.exerciseId} = ${exercises.id}
          AND DATE(${userProgress.completedAt}) = DATE(${today})
        ), 0)`
      }).from(exercises)
        .where(sql`${exercises.id} = ANY(${todayPractice.exerciseIds})`);
    } else {
      // 生成新的每日练习题（5道题，不同难度）
      const easyExercises = await db.select()
        .from(exercises)
        .where(and(
          eq(exercises.isDaily, true),
          eq(exercises.difficulty, 'easy')
        ))
        .orderBy(sql`RANDOM()`)
        .limit(2);

      const mediumExercises = await db.select()
        .from(exercises)
        .where(and(
          eq(exercises.isDaily, true),
          eq(exercises.difficulty, 'medium')
        ))
        .orderBy(sql`RANDOM()`)
        .limit(2);

      const hardExercises = await db.select()
        .from(exercises)
        .where(and(
          eq(exercises.isDaily, true),
          eq(exercises.difficulty, 'hard')
        ))
        .orderBy(sql`RANDOM()`)
        .limit(1);

      const selectedExercises = [...easyExercises, ...mediumExercises, ...hardExercises];
      const exerciseIds = selectedExercises.map(e => e.id);

      // 创建每日练习记录
      [practiceRecord] = await db.insert(dailyPractice).values({
        userId,
        date: today,
        exerciseIds,
        completedCount: 0,
        totalScore: 0,
        streak: 0,
        isCompleted: false
      }).returning();

      dailyExercises = selectedExercises.map(exercise => ({
        ...exercise,
        completed: false,
        score: 0
      }));
    }

    // 获取用户学习统计
    const [stats] = await db.select()
      .from(learningStats)
      .where(eq(learningStats.userId, userId));

    return NextResponse.json({
      success: true,
      data: {
        exercises: dailyExercises,
        practiceRecord,
        stats: {
          currentStreak: stats?.currentStreak || 0,
          longestStreak: stats?.longestStreak || 0,
          totalCompleted: stats?.exercisesCompleted || 0
        }
      }
    });
  } catch (error) {
    console.error('获取每日练习失败:', error);
    return NextResponse.json(
      { success: false, message: '获取每日练习失败' },
      { status: 500 }
    );
  }
}

// 提交每日练习答案
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { exerciseId, answer, timeSpent } = body;

    if (!exerciseId || !answer) {
      return NextResponse.json(
        { success: false, message: '练习ID和答案为必填项' },
        { status: 400 }
      );
    }

    const exerciseIdNum = parseInt(exerciseId);
    if (isNaN(exerciseIdNum)) {
      return NextResponse.json(
        { success: false, message: '无效的练习ID' },
        { status: 400 }
      );
    }

    // 获取练习题信息
    const [exercise] = await db.select()
      .from(exercises)
      .where(eq(exercises.id, exerciseIdNum));

    if (!exercise) {
      return NextResponse.json(
        { success: false, message: '练习题不存在' },
        { status: 404 }
      );
    }

    // 检查答案是否正确
    const isCorrect = answer.toLowerCase().trim() === exercise.correctAnswer.toLowerCase().trim();
    const score = isCorrect ? exercise.points : 0;

    // 更新或创建用户进度
    const today = new Date();
    
    // 先检查是否已存在记录
    const [existingProgress] = await db.select()
      .from(userProgress)
      .where(and(
        eq(userProgress.userId, userId),
        eq(userProgress.exerciseId, exerciseIdNum)
      ));

    let progress;
    if (existingProgress) {
      // 更新现有记录
      [progress] = await db.update(userProgress)
        .set({
          status: 'completed',
          progress: '100.00',
          score,
          timeSpent: existingProgress.timeSpent + (timeSpent || 0),
          attempts: existingProgress.attempts + 1,
          lastAttemptAt: today,
          completedAt: today,
          updatedAt: today
        })
        .where(eq(userProgress.id, existingProgress.id))
        .returning();
    } else {
      // 创建新记录
      [progress] = await db.insert(userProgress).values({
        userId,
        exerciseId: exerciseIdNum,
        status: 'completed',
        progress: '100.00',
        score,
        timeSpent: timeSpent || 0,
        attempts: 1,
        lastAttemptAt: today,
        completedAt: today
      }).returning();
    }

    // 更新每日练习记录
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const [practiceRecord] = await db.select()
      .from(dailyPractice)
      .where(and(
        eq(dailyPractice.userId, userId),
        gte(dailyPractice.date, todayStart),
        lte(dailyPractice.date, todayEnd)
      ));

    if (practiceRecord) {
      const newCompletedCount = practiceRecord.completedCount + 1;
      const newTotalScore = practiceRecord.totalScore + score;
      const isAllCompleted = newCompletedCount >= practiceRecord.exerciseIds.length;

      await db.update(dailyPractice)
        .set({
          completedCount: newCompletedCount,
          totalScore: newTotalScore,
          isCompleted: isAllCompleted,
          updatedAt: today
        })
        .where(eq(dailyPractice.id, practiceRecord.id));

      // 如果完成所有练习，更新连续天数
      if (isAllCompleted) {
        await updateLearningStreak(userId);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        isCorrect,
        score,
        correctAnswer: exercise.correctAnswer,
        explanation: exercise.explanation,
        progress
      },
      message: isCorrect ? '回答正确！' : '回答错误，继续加油！'
    });
  } catch (error) {
    console.error('提交练习答案失败:', error);
    return NextResponse.json(
      { success: false, message: '提交答案失败' },
      { status: 500 }
    );
  }
}

// 更新学习连续天数
async function updateLearningStreak(userId: string) {
  try {
    const [stats] = await db.select()
      .from(learningStats)
      .where(eq(learningStats.userId, userId));

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak = 1;
    
    if (stats) {
      // 检查昨天是否也完成了练习
      const yesterdayStart = new Date(yesterday);
      yesterdayStart.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterdayStart);
      yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);

      const [yesterdayPractice] = await db.select()
        .from(dailyPractice)
        .where(and(
          eq(dailyPractice.userId, userId),
          eq(dailyPractice.isCompleted, true),
          gte(dailyPractice.date, yesterdayStart),
          lte(dailyPractice.date, yesterdayEnd)
        ));

      if (yesterdayPractice) {
        newStreak = stats.currentStreak + 1;
      }

      await db.update(learningStats)
        .set({
          currentStreak: newStreak,
          longestStreak: Math.max(stats.longestStreak, newStreak),
          exercisesCompleted: stats.exercisesCompleted + 1,
          lastStudyDate: today,
          updatedAt: today
        })
        .where(eq(learningStats.userId, userId));
    } else {
      // 创建新的学习统计记录
      await db.insert(learningStats).values({
        userId,
        currentStreak: newStreak,
        longestStreak: newStreak,
        exercisesCompleted: 1,
        lastStudyDate: today
      });
    }
  } catch (error) {
    console.error('更新学习连续天数失败:', error);
  }
}