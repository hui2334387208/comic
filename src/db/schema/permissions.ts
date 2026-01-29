import { pgTable, text, timestamp, varchar, boolean, integer, json } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// 角色表
export const roles = pgTable('roles', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  description: text('description'),
  isSystem: boolean('is_system').notNull().default(false), // 是否为系统角色
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
})

// 权限表
export const permissions = pgTable('permissions', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  description: text('description'),
  module: varchar('module', { length: 50 }).notNull(), // 权限模块
  action: varchar('action', { length: 50 }).notNull(), // 权限动作
  resource: varchar('resource', { length: 100 }), // 权限资源
  field: varchar('field', { length: 100 }), // 字段权限
  condition: text('condition'), // 条件权限 (JSON格式)
  type: varchar('type', { length: 20 }).notNull().default('page'), // 权限类型: page, data, field, button
  isSystem: boolean('is_system').notNull().default(false), // 是否为系统权限
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
})

// 用户角色关联表
export const userRoles = pgTable('user_roles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  roleId: text('role_id').notNull(),
  assignedBy: text('assigned_by').notNull(), // 分配者ID
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'), // 角色过期时间
  isActive: boolean('is_active').notNull().default(true),
  priority: integer('priority').notNull().default(0), // 角色优先级
  reason: text('reason'), // 分配原因
  dataScope: json('data_scope').$type<DataScope>(), // 数据权限范围
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
})

// 数据权限范围类型
export interface DataScope {
  type: 'all' | 'department' | 'self' | 'custom'
  value?: any
  conditions?: string[]
}

// 角色权限关联表
export const rolePermissions = pgTable('role_permissions', {
  id: text('id').primaryKey(),
  roleId: text('role_id').notNull(),
  permissionId: text('permission_id').notNull(),
  grantedBy: text('granted_by').notNull(), // 授权者ID
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
  isActive: boolean('is_active').notNull().default(true), // 权限是否激活
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
})

// 权限请求表
export const permissionRequests = pgTable('permission_requests', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  roleId: text('role_id').notNull(),
  reason: text('reason').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, approved, rejected
  reviewedBy: text('reviewed_by'), // 审核者ID
  reviewedAt: timestamp('reviewed_at'),
  reviewComment: text('review_comment'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
})

// 用户直接权限表
export const userPermissions = pgTable('user_permissions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  permissionId: text('permission_id').notNull(),
  type: varchar('type', { length: 20 }).notNull().default('direct'), // direct: 直接权限, restricted: 限制权限
  grantedBy: text('granted_by').notNull(), // 授权者ID
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'), // 权限过期时间
  isActive: boolean('is_active').notNull().default(true),
  reason: text('reason'), // 授权原因
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
})

// 权限日志表
export const permissionLogs = pgTable('permission_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(), // grant, revoke, request, approve, reject
  targetType: varchar('target_type', { length: 20 }).notNull(), // role, permission
  targetId: text('target_id').notNull(),
  details: json('details').$type<Record<string, any>>(),
  ip: varchar('ip', { length: 45 }),
  userAgent: text('user_agent'),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

// 定义关系
export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
  permissionRequests: many(permissionRequests),
}))

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userPermissions: many(userPermissions),
}))

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}))

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}))

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  permission: one(permissions, {
    fields: [userPermissions.permissionId],
    references: [permissions.id],
  }),
}))

export const permissionRequestsRelations = relations(permissionRequests, ({ one }) => ({
  role: one(roles, {
    fields: [permissionRequests.roleId],
    references: [roles.id],
  }),
}))
