import {
  serial,
  timestamp,
  varchar,
  integer,
  boolean,
  pgTable,
  text,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

import { users } from './users'
import { couplets } from './couplet'

// 对联PK比赛表
export const coupletBattles = pgTable('couplet_battles', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(), // 比赛标题
  description: text('description'), // 比赛描述
  theme: varchar('theme', { length: 255 }), // 比赛主题
  creatorId: text('creator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('recruiting'), // recruiting: 招募中, ongoing: 进行中, voting: 投票中, completed: 已完成, cancelled: 已取消
  battleType: varchar('battle_type', { length: 20 }).notNull().default('1v1'), // 1v1, group, tournament
  maxParticipants: integer('max_participants').default(2), // 最大参与人数
  currentParticipants: integer('current_participants').default(0), // 当前参与人数
  timeLimit: integer('time_limit').default(3600), // 创作时间限制（秒）
  votingTimeLimit: integer('voting_time_limit').default(86400), // 投票时间限制（秒）
  startTime: timestamp('start_time'), // 比赛开始时间
  endTime: timestamp('end_time'), // 比赛结束时间
  votingStartTime: timestamp('voting_start_time'), // 投票开始时间
  votingEndTime: timestamp('voting_end_time'), // 投票结束时间
  winnerId: text('winner_id').references(() => users.id, { onDelete: 'set null' }), // 获胜者ID
  rules: jsonb('rules'), // 比赛规则（JSON格式）
  rewards: jsonb('rewards'), // 奖励设置（JSON格式）
  isPublic: boolean('is_public').notNull().default(true), // 是否公开
  language: varchar('language', { length: 10 }).notNull().default('zh'), // 语言
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 对联PK参与者表
export const coupletBattleParticipants = pgTable('couplet_battle_participants', {
  id: serial('id').primaryKey(),
  battleId: integer('battle_id').notNull().references(() => coupletBattles.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  coupletId: integer('couplet_id').references(() => couplets.id, { onDelete: 'set null' }), // 提交的对联ID
  submissionTime: timestamp('submission_time'), // 提交时间
  status: varchar('status', { length: 20 }).notNull().default('joined'), // joined: 已加入, submitted: 已提交, disqualified: 被取消资格
  score: integer('score').default(0), // 得分
  rank: integer('rank'), // 排名
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
})

// 对联PK投票表
export const coupletBattleVotes = pgTable('couplet_battle_votes', {
  id: serial('id').primaryKey(),
  battleId: integer('battle_id').notNull().references(() => coupletBattles.id, { onDelete: 'cascade' }),
  voterId: text('voter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  participantId: integer('participant_id').notNull().references(() => coupletBattleParticipants.id, { onDelete: 'cascade' }),
  voteType: varchar('vote_type', { length: 20 }).notNull().default('like'), // like: 点赞, expert: 专家评分
  score: integer('score').default(1), // 投票分数
  comment: text('comment'), // 投票评论
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 协作创作表
export const coupletCollaborations = pgTable('couplet_collaborations', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(), // 协作标题
  description: text('description'), // 协作描述
  theme: varchar('theme', { length: 255 }), // 协作主题
  creatorId: text('creator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  coupletId: integer('couplet_id').references(() => couplets.id, { onDelete: 'set null' }), // 最终对联ID
  status: varchar('status', { length: 20 }).notNull().default('recruiting'), // recruiting: 招募中, ongoing: 进行中, completed: 已完成, cancelled: 已取消
  maxCollaborators: integer('max_collaborators').default(5), // 最大协作者数量
  currentCollaborators: integer('current_collaborators').default(1), // 当前协作者数量
  collaborationType: varchar('collaboration_type', { length: 20 }).notNull().default('sequential'), // sequential: 顺序协作, parallel: 并行协作
  timeLimit: integer('time_limit').default(86400), // 协作时间限制（秒）
  currentStep: integer('current_step').default(1), // 当前步骤
  totalSteps: integer('total_steps').default(3), // 总步骤数（上联、下联、横批）
  rules: jsonb('rules'), // 协作规则
  isPublic: boolean('is_public').notNull().default(true),
  language: varchar('language', { length: 10 }).notNull().default('zh'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 协作参与者表
export const coupletCollaborationParticipants = pgTable('couplet_collaboration_participants', {
  id: serial('id').primaryKey(),
  collaborationId: integer('collaboration_id').notNull().references(() => coupletCollaborations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull().default('collaborator'), // creator: 创建者, collaborator: 协作者, reviewer: 审核者
  contribution: text('contribution'), // 贡献内容
  contributionType: varchar('contribution_type', { length: 20 }), // upper_line: 上联, lower_line: 下联, horizontal_scroll: 横批, review: 审核
  step: integer('step'), // 贡献的步骤
  status: varchar('status', { length: 20 }).notNull().default('active'), // active: 活跃, inactive: 不活跃, removed: 已移除
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
})

// 对联接龙表
export const coupletChains = pgTable('couplet_chains', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(), // 接龙标题
  description: text('description'), // 接龙描述
  theme: varchar('theme', { length: 255 }), // 接龙主题
  creatorId: text('creator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  startLine: varchar('start_line', { length: 255 }).notNull(), // 起始句（上联或下联）
  startLineType: varchar('start_line_type', { length: 20 }).notNull().default('upper'), // upper: 上联, lower: 下联
  status: varchar('status', { length: 20 }).notNull().default('active'), // active: 活跃, completed: 已完成, closed: 已关闭
  chainType: varchar('chain_type', { length: 20 }).notNull().default('continuous'), // continuous: 连续接龙, best_match: 最佳匹配
  maxEntries: integer('max_entries').default(100), // 最大接龙数量
  currentEntries: integer('current_entries').default(0), // 当前接龙数量
  timeLimit: integer('time_limit').default(604800), // 接龙时间限制（秒，默认7天）
  rules: jsonb('rules'), // 接龙规则
  isPublic: boolean('is_public').notNull().default(true),
  language: varchar('language', { length: 10 }).notNull().default('zh'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 对联接龙条目表
export const coupletChainEntries = pgTable('couplet_chain_entries', {
  id: serial('id').primaryKey(),
  chainId: integer('chain_id').notNull().references(() => coupletChains.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: varchar('content', { length: 255 }).notNull(), // 接龙内容
  contentType: varchar('content_type', { length: 20 }).notNull(), // upper_line: 上联, lower_line: 下联, horizontal_scroll: 横批
  parentId: integer('parent_id'), // 父级接龙ID - self-reference handled in relations
  orderIndex: integer('order_index').default(0), // 排序索引
  likeCount: integer('like_count').default(0), // 点赞数
  isSelected: boolean('is_selected').default(false), // 是否被选中为最佳
  status: varchar('status', { length: 20 }).notNull().default('active'), // active: 活跃, hidden: 隐藏, deleted: 已删除
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 对联接龙点赞表
export const coupletChainLikes = pgTable('couplet_chain_likes', {
  id: serial('id').primaryKey(),
  entryId: integer('entry_id').notNull().references(() => coupletChainEntries.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 导师系统表
export const mentorProfiles = pgTable('mentor_profiles', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }), // 导师头衔
  bio: text('bio'), // 导师简介
  expertise: jsonb('expertise'), // 专长领域（JSON数组）
  experience: text('experience'), // 经验描述
  achievements: jsonb('achievements'), // 成就列表
  rating: integer('rating').default(0), // 评分（0-100）
  totalStudents: integer('total_students').default(0), // 总学生数
  activeStudents: integer('active_students').default(0), // 活跃学生数
  maxStudents: integer('max_students').default(10), // 最大学生数
  hourlyRate: integer('hourly_rate'), // 时薪（分）
  availability: jsonb('availability'), // 可用时间
  status: varchar('status', { length: 20 }).notNull().default('active'), // active: 活跃, inactive: 不活跃, suspended: 暂停
  verificationStatus: varchar('verification_status', { length: 20 }).notNull().default('pending'), // pending: 待审核, verified: 已认证, rejected: 已拒绝
  verifiedAt: timestamp('verified_at'), // 认证时间
  language: varchar('language', { length: 10 }).notNull().default('zh'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 师生关系表
export const mentorStudentRelations = pgTable('mentor_student_relations', {
  id: serial('id').primaryKey(),
  mentorId: text('mentor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending: 待确认, active: 活跃, completed: 已完成, cancelled: 已取消
  startDate: timestamp('start_date'), // 开始时间
  endDate: timestamp('end_date'), // 结束时间
  totalSessions: integer('total_sessions').default(0), // 总课程数
  completedSessions: integer('completed_sessions').default(0), // 已完成课程数
  studentRating: integer('student_rating'), // 学生评分
  mentorRating: integer('mentor_rating'), // 导师评分
  studentFeedback: text('student_feedback'), // 学生反馈
  mentorFeedback: text('mentor_feedback'), // 导师反馈
  notes: text('notes'), // 备注
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 指导课程表
export const mentorSessions = pgTable('mentor_sessions', {
  id: serial('id').primaryKey(),
  relationId: integer('relation_id').notNull().references(() => mentorStudentRelations.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(), // 课程标题
  description: text('description'), // 课程描述
  sessionType: varchar('session_type', { length: 20 }).notNull().default('guidance'), // guidance: 指导, review: 点评, practice: 练习
  scheduledTime: timestamp('scheduled_time'), // 预定时间
  actualStartTime: timestamp('actual_start_time'), // 实际开始时间
  actualEndTime: timestamp('actual_end_time'), // 实际结束时间
  duration: integer('duration'), // 持续时间（分钟）
  status: varchar('status', { length: 20 }).notNull().default('scheduled'), // scheduled: 已安排, ongoing: 进行中, completed: 已完成, cancelled: 已取消
  content: text('content'), // 课程内容
  homework: text('homework'), // 作业内容
  feedback: text('feedback'), // 反馈
  rating: integer('rating'), // 评分
  notes: text('notes'), // 备注
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 社交活动表
export const socialActivities = pgTable('social_activities', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  activityType: varchar('activity_type', { length: 50 }).notNull(), // battle_join, battle_win, collaboration_join, chain_participate, mentor_apply, etc.
  targetType: varchar('target_type', { length: 20 }).notNull(), // battle, collaboration, chain, mentor, etc.
  targetId: integer('target_id').notNull(), // 目标ID
  description: text('description'), // 活动描述
  metadata: jsonb('metadata'), // 额外数据
  isPublic: boolean('is_public').notNull().default(true), // 是否公开显示
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 定义关系
export const coupletBattlesRelations = relations(coupletBattles, ({ one, many }) => ({
  creator: one(users, {
    fields: [coupletBattles.creatorId],
    references: [users.id],
  }),
  winner: one(users, {
    fields: [coupletBattles.winnerId],
    references: [users.id],
  }),
  participants: many(coupletBattleParticipants),
  votes: many(coupletBattleVotes),
}))

export const coupletBattleParticipantsRelations = relations(coupletBattleParticipants, ({ one, many }) => ({
  battle: one(coupletBattles, {
    fields: [coupletBattleParticipants.battleId],
    references: [coupletBattles.id],
  }),
  user: one(users, {
    fields: [coupletBattleParticipants.userId],
    references: [users.id],
  }),
  couplet: one(couplets, {
    fields: [coupletBattleParticipants.coupletId],
    references: [couplets.id],
  }),
  votes: many(coupletBattleVotes),
}))

export const coupletCollaborationsRelations = relations(coupletCollaborations, ({ one, many }) => ({
  creator: one(users, {
    fields: [coupletCollaborations.creatorId],
    references: [users.id],
  }),
  couplet: one(couplets, {
    fields: [coupletCollaborations.coupletId],
    references: [couplets.id],
  }),
  participants: many(coupletCollaborationParticipants),
}))

export const coupletChainsRelations = relations(coupletChains, ({ one, many }) => ({
  creator: one(users, {
    fields: [coupletChains.creatorId],
    references: [users.id],
  }),
  entries: many(coupletChainEntries),
}))

export const coupletChainEntriesRelations = relations(coupletChainEntries, ({ one, many }) => ({
  chain: one(coupletChains, {
    fields: [coupletChainEntries.chainId],
    references: [coupletChains.id],
  }),
  user: one(users, {
    fields: [coupletChainEntries.userId],
    references: [users.id],
  }),
  parent: one(coupletChainEntries, {
    fields: [coupletChainEntries.parentId],
    references: [coupletChainEntries.id],
    relationName: 'parentChild',
  }),
  children: many(coupletChainEntries, {
    relationName: 'parentChild',
  }),
  likes: many(coupletChainLikes),
}))

export const mentorProfilesRelations = relations(mentorProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [mentorProfiles.userId],
    references: [users.id],
  }),
  studentRelations: many(mentorStudentRelations, {
    relationName: 'mentorRelations',
  }),
}))

export const mentorStudentRelationsRelations = relations(mentorStudentRelations, ({ one, many }) => ({
  mentor: one(users, {
    fields: [mentorStudentRelations.mentorId],
    references: [users.id],
  }),
  student: one(users, {
    fields: [mentorStudentRelations.studentId],
    references: [users.id],
  }),
  sessions: many(mentorSessions),
}))

export const mentorSessionsRelations = relations(mentorSessions, ({ one }) => ({
  relation: one(mentorStudentRelations, {
    fields: [mentorSessions.relationId],
    references: [mentorStudentRelations.id],
  }),
}))

export const socialActivitiesRelations = relations(socialActivities, ({ one }) => ({
  user: one(users, {
    fields: [socialActivities.userId],
    references: [users.id],
  }),
}))