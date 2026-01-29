import { db } from '@/db'
import { userPermissions, permissions } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * 为用户分配直接权限
 */
export async function grantUserPermission(
  userId: string,
  permissionId: string,
  grantedBy: string,
  type: 'direct' | 'restricted' = 'direct',
  reason?: string,
  expiresAt?: Date
) {
  const id = `up_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  return await db.insert(userPermissions).values({
    id,
    userId,
    permissionId,
    type,
    grantedBy,
    reason,
    expiresAt,
    isActive: true
  })
}

/**
 * 撤销用户直接权限
 */
export async function revokeUserPermission(
  userId: string,
  permissionId: string
) {
  return await db
    .update(userPermissions)
    .set({ isActive: false })
    .where(
      and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.permissionId, permissionId)
      )
    )
}

/**
 * 获取用户直接权限列表
 */
export async function getUserDirectPermissions(userId: string) {
  return await db
    .select({
      id: userPermissions.id,
      permissionName: permissions.name,
      type: userPermissions.type,
      grantedBy: userPermissions.grantedBy,
      grantedAt: userPermissions.grantedAt,
      expiresAt: userPermissions.expiresAt,
      reason: userPermissions.reason
    })
    .from(userPermissions)
    .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
    .where(
      and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.isActive, true)
      )
    )
}

/**
 * 检查用户是否有特定直接权限
 */
export async function hasUserDirectPermission(
  userId: string,
  permissionName: string
): Promise<boolean> {
  const result = await db
    .select({ id: userPermissions.id })
    .from(userPermissions)
    .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
    .where(
      and(
        eq(userPermissions.userId, userId),
        eq(permissions.name, permissionName),
        eq(userPermissions.type, 'direct'),
        eq(userPermissions.isActive, true)
      )
    )
    .limit(1)

  return result.length > 0
}

/**
 * 检查用户是否有特定限制权限
 */
export async function hasUserRestrictedPermission(
  userId: string,
  permissionName: string
): Promise<boolean> {
  const result = await db
    .select({ id: userPermissions.id })
    .from(userPermissions)
    .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
    .where(
      and(
        eq(userPermissions.userId, userId),
        eq(permissions.name, permissionName),
        eq(userPermissions.type, 'restricted'),
        eq(userPermissions.isActive, true)
      )
    )
    .limit(1)

  return result.length > 0
}