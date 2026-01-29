import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { userRoles, rolePermissions, permissions, users, userPermissions } from '@/db/schema'
import { eq, and, inArray, sql } from 'drizzle-orm'
import { DataScope } from '@/db/schema/permissions'

export interface PermissionCheckResult {
  hasPermission: boolean
  userRoles: string[]
  userPermissions: string[]
  directPermissions: string[]
  restrictedPermissions: string[]
  dataScope?: DataScope
  reason?: string
}

export interface DataPermissionResult {
  hasAccess: boolean
  dataScope: DataScope
  allowedFields?: string[]
  conditions?: string[]
}

/**
 * 检查用户是否有特定权限
 */
export async function checkUserPermission(
  userId: string, 
  permissionName: string
): Promise<PermissionCheckResult> {
  try {
    // 从数据库获取用户权限
    const userPermissionData = await getUserPermissionsFromDB(userId)

    return {
      hasPermission: userPermissionData.permissions.includes(permissionName) || userPermissionData.permissions.includes('*'),
      userRoles: userPermissionData.roles,
      userPermissions: userPermissionData.permissions,
      directPermissions: userPermissionData.directPermissions,
      restrictedPermissions: userPermissionData.restrictedPermissions
    }
  } catch (error) {
    console.error('Permission check error:', error)
    return {
      hasPermission: false,
      userRoles: [],
      userPermissions: [],
      directPermissions: [],
      restrictedPermissions: [],
      reason: 'Permission check failed'
    }
  }
}

/**
 * 检查用户是否有任意一个权限
 */
export async function checkUserAnyPermission(
  userId: string, 
  permissionNames: string[]
): Promise<PermissionCheckResult> {
  const result = await checkUserPermission(userId, '') // 获取所有权限
  const hasAny = permissionNames.some(perm => 
    result.userPermissions.includes(perm) || result.userPermissions.includes('*')
  )
  
  return {
    ...result,
    hasPermission: hasAny
  }
}

/**
 * 检查用户是否有所有权限
 */
export async function checkUserAllPermissions(
  userId: string, 
  permissionNames: string[]
): Promise<PermissionCheckResult> {
  const result = await checkUserPermission(userId, '') // 获取所有权限
  const hasAll = permissionNames.every(perm => 
    result.userPermissions.includes(perm) || result.userPermissions.includes('*')
  )
  
  return {
    ...result,
    hasPermission: hasAll
  }
}

/**
 * 检查用户数据权限
 */
export async function checkUserDataPermission(
  userId: string,
  resource: string,
  action: string = 'read'
): Promise<DataPermissionResult> {
  try {
    const userPermissionData = await getUserPermissionsFromDB(userId)
    
    // 检查是否有该资源的操作权限
    const hasResourcePermission = userPermissionData.permissions.includes(`${resource}.${action}`) ||
                                 userPermissionData.permissions.includes('*')
    
    if (!hasResourcePermission) {
      return {
        hasAccess: false,
        dataScope: { type: 'self' }
      }
    }

    // 获取数据权限范围
    const dataScope = userPermissionData.dataScope || { type: 'self' }
    
    // 获取字段权限
    const fieldPermissions = userPermissionData.permissions
      .filter(p => p.startsWith(`${resource}.${action}.field.`))
      .map(p => p.replace(`${resource}.${action}.field.`, ''))

    return {
      hasAccess: true,
      dataScope,
      allowedFields: fieldPermissions.length > 0 ? fieldPermissions : undefined
    }
  } catch (error) {
    console.error('Data permission check error:', error)
    return {
      hasAccess: false,
      dataScope: { type: 'self' }
    }
  }
}

/**
 * 应用数据权限过滤
 */
export function applyDataScopeFilter(
  query: any,
  dataScope: DataScope,
  userId: string,
  resource: string
): any {
  switch (dataScope.type) {
    case 'all':
      return query // 不添加任何过滤条件
    case 'department':
      // 部门权限暂时不实现
      return query.where(eq(users.id, userId))
    case 'self':
      return query.where(eq(users.id, userId))
    case 'custom':
      // 应用自定义条件
      if (dataScope.conditions) {
        dataScope.conditions.forEach(condition => {
          // 这里可以根据具体需求解析条件
          // 例如: "status = 'active' AND created_at > '2024-01-01'"
          query = query.where(sql.raw(condition))
        })
      }
      return query
    default:
      return query.where(eq(users.id, userId)) // 默认只能访问自己的数据
  }
}

/**
 * 过滤敏感字段
 */
export function filterSensitiveFields(
  data: any,
  allowedFields?: string[]
): any {
  if (!allowedFields || allowedFields.length === 0) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(item => filterSensitiveFields(item, allowedFields))
  }

  if (typeof data === 'object' && data !== null) {
    const filtered: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        filtered[key] = value
      }
    }
    return filtered
  }

  return data
}

/**
 * 检查用户是否有特定角色
 */
export async function checkUserRole(userId: string, roleName: string): Promise<boolean> {
  const result = await checkUserPermission(userId, '')
  return result.userRoles.includes(roleName)
}

/**
 * 从数据库获取用户权限（支持直接权限和角色权限）
 */
export async function getUserPermissionsFromDB(userId: string): Promise<{
  roles: string[]
  permissions: string[]
  directPermissions: string[]
  restrictedPermissions: string[]
  dataScope?: DataScope
}> {

  // 1. 获取用户角色
  const userRolesData = await db
    .select({ 
      roleId: userRoles.roleId,
      dataScope: userRoles.dataScope
    })
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.isActive, true),
        sql`(${userRoles.expiresAt} IS NULL OR ${userRoles.expiresAt} > NOW())`
      )
    )

  const roleIds = userRolesData.map(ur => ur.roleId)

  // 2. 获取用户直接权限
  const userDirectPermissionsData = await db
    .select({ 
      permissionName: permissions.name,
      type: userPermissions.type
    })
    .from(userPermissions)
    .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
    .where(
      and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.isActive, true),
        sql`(${userPermissions.expiresAt} IS NULL OR ${userPermissions.expiresAt} > NOW())`
      )
    )

  // 分离直接权限和限制权限
  const directPermissions = userDirectPermissionsData
    .filter(up => up.type === 'direct')
    .map(up => up.permissionName)
  
  const restrictedPermissions = userDirectPermissionsData
    .filter(up => up.type === 'restricted')
    .map(up => up.permissionName)

  // 3. 获取角色权限
  let rolePermissionsData: any[] = []
  if (roleIds.length > 0) {
    rolePermissionsData = await db
      .select({ 
        permissionName: permissions.name,
        permissionType: permissions.type,
        resource: permissions.resource,
        field: permissions.field
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          inArray(rolePermissions.roleId, roleIds),
          eq(rolePermissions.isActive, true)
        )
      )
  }

  const rolePermissionNames = rolePermissionsData.map(rp => rp.permissionName)
  
  // 4. 合并权限（直接权限优先，限制权限覆盖）
  const allPermissions = [...new Set([
    ...rolePermissionNames,  // 角色权限
    ...directPermissions      // 直接权限（覆盖角色权限）
  ])]

  // 移除被限制的权限
  const finalPermissions = allPermissions.filter(permission => 
    !restrictedPermissions.includes(permission)
  )
  
  // 获取数据权限范围（取最高优先级角色的数据权限）
  const dataScope = userRolesData
    .filter(ur => ur.dataScope)
    .sort((a, b) => (a.dataScope?.type === 'all' ? 1 : 0) - (b.dataScope?.type === 'all' ? 1 : 0))
    [0]?.dataScope

  const result = {
    roles: roleIds,
    permissions: finalPermissions,
    directPermissions,
    restrictedPermissions,
    dataScope: dataScope || undefined
  }
  
  return result
}


/**
 * 权限检查装饰器 - 用于API路由
 */
export function requirePermission(permission: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const [request] = args
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.id) {
        return new Response(JSON.stringify({ error: '未授权访问' }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const permissionResult = await checkUserPermission(session.user.id, permission)
      if (!permissionResult.hasPermission) {
        return new Response(JSON.stringify({ 
          error: '权限不足',
          required: permission,
          userPermissions: permissionResult.userPermissions
        }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return originalMethod.apply(this, args)
    }
  }
}

/**
 * 角色检查装饰器 - 用于API路由
 */
export function requireRole(role: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const [request] = args
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.id) {
        return new Response(JSON.stringify({ error: '未授权访问' }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const hasRole = await checkUserRole(session.user.id, role)
      if (!hasRole) {
        return new Response(JSON.stringify({ 
          error: '角色权限不足',
          required: role
        }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return originalMethod.apply(this, args)
    }
  }
}
