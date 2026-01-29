import { pgTable, text, integer, timestamp, boolean, jsonb, varchar, decimal, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// 课程表
export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  level: varchar('level', { length: 20 }).notNull().default('beginner'), // beginner, intermediate, advanced, expert
  category: varchar('category', { length: 50 }).notNull(), // basic, rhythm, theme, advanced
  coverImage: text('cover_image'),
  duration: integer('duration'), // 预计学习时长（分钟）
  order: integer('order').notNull().default(0), // 课程顺序
  isPublished: boolean('is_published').notNull().default(false),
  prerequisites: jsonb('prerequisites').$type<number[]>(), // 前置课程ID
  learningObjectives: jsonb('learning_objectives').$type<string[]>(), // 学习目标
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 课程章节表
export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(), // 课程内容（Markdown格式）
  videoUrl: text('video_url'), // 视频链接
  order: integer('order').notNull().default(0),
  duration: integer('duration'), // 章节时长（分钟）
  isPreview: boolean('is_preview').notNull().default(false), // 是否可预览
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 练习题表
export const exercises = pgTable('exercises', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 30 }).notNull(), // fill_blank, error_correction, creation, matching, choice
  title: text('title').notNull(),
  question: text('question').notNull(),
  options: jsonb('options').$type<string[]>(), // 选择题选项
  correctAnswer: text('correct_answer').notNull(),
  explanation: text('explanation'), // 答案解释
  hints: jsonb('hints').$type<string[]>(), // 提示
  difficulty: varchar('difficulty', { length: 20 }).notNull().default('easy'), // easy, medium, hard
  points: integer('points').notNull().default(10), // 完成获得积分
  timeLimit: integer('time_limit'), // 时间限制（秒）
  tags: jsonb('tags').$type<string[]>(), // 标签
  isDaily: boolean('is_daily').notNull().default(false), // 是否为每日一练
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 学习路径表
export const learningPaths = pgTable('learning_paths', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  level: varchar('level', { length: 20 }).notNull(), // beginner, intermediate, advanced
  estimatedDuration: integer('estimated_duration'), // 预计完成时间（天）
  courseIds: jsonb('course_ids').$type<number[]>().notNull(), // 包含的课程ID
  prerequisites: jsonb('prerequisites').$type<string[]>(), // 前置技能名称
  learningGoals: jsonb('learning_goals').$type<string[]>(), // 学习目标
  isRecommended: boolean('is_recommended').notNull().default(false), // 是否推荐路径
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 用户学习进度表
export const userProgress = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }),
  exerciseId: integer('exercise_id').references(() => exercises.id, { onDelete: 'cascade' }),
  pathId: integer('path_id').references(() => learningPaths.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('not_started'), // not_started, in_progress, completed, mastered
  progress: decimal('progress', { precision: 5, scale: 2 }).notNull().default('0'), // 进度百分比
  score: integer('score'), // 得分
  timeSpent: integer('time_spent').notNull().default(0), // 学习时间（分钟）
  attempts: integer('attempts').notNull().default(0), // 尝试次数
  lastAttemptAt: timestamp('last_attempt_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 每日练习记录表
export const dailyPractice = pgTable('daily_practice', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp('date').notNull(),
  exerciseIds: jsonb('exercise_ids').$type<number[]>().notNull(), // 当日练习题ID
  completedCount: integer('completed_count').notNull().default(0),
  totalScore: integer('total_score').notNull().default(0),
  streak: integer('streak').notNull().default(0), // 连续天数
  isCompleted: boolean('is_completed').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 学习统计表
export const learningStats = pgTable('learning_stats', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  totalStudyTime: integer('total_study_time').notNull().default(0), // 总学习时间（分钟）
  coursesCompleted: integer('courses_completed').notNull().default(0), // 完成课程数
  exercisesCompleted: integer('exercises_completed').notNull().default(0), // 完成练习数
  currentStreak: integer('current_streak').notNull().default(0), // 当前连续学习天数
  longestStreak: integer('longest_streak').notNull().default(0), // 最长连续学习天数
  averageScore: decimal('average_score', { precision: 5, scale: 2 }).notNull().default('0'), // 平均分数
  level: integer('level').notNull().default(1), // 学习等级
  experience: integer('experience').notNull().default(0), // 经验值
  lastStudyDate: timestamp('last_study_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// AI导师会话表
export const aiTutorSessions = pgTable('ai_tutor_sessions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionType: varchar('session_type', { length: 30 }).notNull(), // guidance, feedback, recommendation, qa
  context: jsonb('context'), // 会话上下文
  messages: jsonb('messages').$type<Array<{role: string, content: string, timestamp: string}>>().notNull(),
  learningGoals: jsonb('learning_goals').$type<string[]>(), // 学习目标
  recommendations: jsonb('recommendations'), // AI推荐
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 学习徽章表（扩展现有徽章系统）
export const educationBadges = pgTable('education_badges', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon').notNull(),
  color: varchar('color', { length: 20 }).notNull().default('red'), // 中国风红色主题
  category: varchar('category', { length: 30 }).notNull(), // course_completion, streak, mastery, creativity
  requirement: jsonb('requirement'), // 获得条件
  rarity: varchar('rarity', { length: 20 }).notNull().default('common'), // common, rare, epic, legendary
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 用户教育徽章表
export const userEducationBadges = pgTable('user_education_badges', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  badgeId: integer('badge_id').references(() => educationBadges.id, { onDelete: 'cascade' }).notNull(),
  earnedAt: timestamp('earned_at').defaultNow().notNull(),
  progress: decimal('progress', { precision: 5, scale: 2 }).notNull().default('100'), // 完成进度
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 关系定义
export const coursesRelations = relations(courses, ({ many }) => ({
  lessons: many(lessons),
  exercises: many(exercises),
  userProgress: many(userProgress),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
  exercises: many(exercises),
  userProgress: many(userProgress),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [exercises.lessonId],
    references: [lessons.id],
  }),
  course: one(courses, {
    fields: [exercises.courseId],
    references: [courses.id],
  }),
  userProgress: many(userProgress),
}));

export const learningPathsRelations = relations(learningPaths, ({ many }) => ({
  userProgress: many(userProgress),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [userProgress.courseId],
    references: [courses.id],
  }),
  lesson: one(lessons, {
    fields: [userProgress.lessonId],
    references: [lessons.id],
  }),
  exercise: one(exercises, {
    fields: [userProgress.exerciseId],
    references: [exercises.id],
  }),
  path: one(learningPaths, {
    fields: [userProgress.pathId],
    references: [learningPaths.id],
  }),
}));

export const dailyPracticeRelations = relations(dailyPractice, ({ one }) => ({
  user: one(users, {
    fields: [dailyPractice.userId],
    references: [users.id],
  }),
}));

export const learningStatsRelations = relations(learningStats, ({ one }) => ({
  user: one(users, {
    fields: [learningStats.userId],
    references: [users.id],
  }),
}));

export const aiTutorSessionsRelations = relations(aiTutorSessions, ({ one }) => ({
  user: one(users, {
    fields: [aiTutorSessions.userId],
    references: [users.id],
  }),
}));

export const educationBadgesRelations = relations(educationBadges, ({ many }) => ({
  userBadges: many(userEducationBadges),
}));

export const userEducationBadgesRelations = relations(userEducationBadges, ({ one }) => ({
  user: one(users, {
    fields: [userEducationBadges.userId],
    references: [users.id],
  }),
  badge: one(educationBadges, {
    fields: [userEducationBadges.badgeId],
    references: [educationBadges.id],
  }),
}));