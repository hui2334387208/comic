import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { checkUserPermission, checkUserDataPermission } from './permissions'

/**
 * 权限检查中间件
 */
export function requirePermission(permission: string) {
  return async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions)

      if (!session?.user?.id) {
        return NextResponse.json({
          error: '未授权访问',
          code: 'UNAUTHORIZED'
        }, { status: 401 })
      }

      const permissionResult = await checkUserPermission(session.user.id, permission)

      if (!permissionResult.hasPermission) {
        return NextResponse.json({
          error: '权限不足',
          code: 'FORBIDDEN',
          required: permission,
          userPermissions: permissionResult.userPermissions
        }, { status: 403 })
      }

      // 将权限信息添加到请求头中，供后续使用
      request.headers.set('x-user-permissions', JSON.stringify({
        roles: permissionResult.userRoles,
        permissions: permissionResult.userPermissions,
        dataScope: permissionResult.dataScope
      }))

      return null // 继续执行
    } catch (error) {
      console.error('Permission middleware error:', error)
      return NextResponse.json({
        error: '权限检查失败',
        code: 'PERMISSION_CHECK_ERROR'
      }, { status: 500 })
    }
  }
}

/**
 * 数据权限检查中间件
 */
export function requireDataPermission(resource: string, action: string = 'read') {
  return async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions)

      if (!session?.user?.id) {
        return NextResponse.json({
          error: '未授权访问',
          code: 'UNAUTHORIZED'
        }, { status: 401 })
      }

      const dataPermissionResult = await checkUserDataPermission(
        session.user.id,
        resource,
        action
      )

      if (!dataPermissionResult.hasAccess) {
        return NextResponse.json({
          error: '数据访问权限不足',
          code: 'DATA_ACCESS_FORBIDDEN',
          resource,
          action
        }, { status: 403 })
      }

      // 将数据权限信息添加到请求头中
      request.headers.set('x-data-permissions', JSON.stringify({
        dataScope: dataPermissionResult.dataScope,
        allowedFields: dataPermissionResult.allowedFields,
        conditions: dataPermissionResult.conditions
      }))

      return null // 继续执行
    } catch (error) {
      console.error('Data permission middleware error:', error)
      return NextResponse.json({
        error: '数据权限检查失败',
        code: 'DATA_PERMISSION_CHECK_ERROR'
      }, { status: 500 })
    }
  }
}

/**
 * 角色检查中间件
 */
export function requireRole(role: string) {
  return async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions)

      if (!session?.user?.id) {
        return NextResponse.json({
          error: '未授权访问',
          code: 'UNAUTHORIZED'
        }, { status: 401 })
      }

      const permissionResult = await checkUserPermission(session.user.id, '')

      if (!permissionResult.userRoles.includes(role)) {
        return NextResponse.json({
          error: '角色权限不足',
          code: 'ROLE_FORBIDDEN',
          required: role,
          userRoles: permissionResult.userRoles
        }, { status: 403 })
      }

      return null // 继续执行
    } catch (error) {
      console.error('Role middleware error:', error)
      return NextResponse.json({
        error: '角色检查失败',
        code: 'ROLE_CHECK_ERROR'
      }, { status: 500 })
    }
  }
}

/**
 * 组合权限检查中间件
 */
export function requirePermissions(permissions: string[], requireAll: boolean = false) {
  return async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions)

      if (!session?.user?.id) {
        return NextResponse.json({
          error: '未授权访问',
          code: 'UNAUTHORIZED'
        }, { status: 401 })
      }

      const permissionResult = await checkUserPermission(session.user.id, '')

      let hasRequiredPermissions: boolean
      if (requireAll) {
        hasRequiredPermissions = permissions.every(perm =>
          permissionResult.userPermissions.includes(perm) ||
          permissionResult.userPermissions.includes('*')
        )
      } else {
        hasRequiredPermissions = permissions.some(perm =>
          permissionResult.userPermissions.includes(perm) ||
          permissionResult.userPermissions.includes('*')
        )
      }

      if (!hasRequiredPermissions) {
        return NextResponse.json({
          error: '权限不足',
          code: 'PERMISSIONS_FORBIDDEN',
          required: permissions,
          userPermissions: permissionResult.userPermissions,
          requireAll
        }, { status: 403 })
      }

      return null // 继续执行
    } catch (error) {
      console.error('Permissions middleware error:', error)
      return NextResponse.json({
        error: '权限检查失败',
        code: 'PERMISSIONS_CHECK_ERROR'
      }, { status: 500 })
    }
  }
}

/**
 * 从请求头获取权限信息
 */
export function getPermissionsFromRequest(request: NextRequest) {
  const userPermissionsHeader = request.headers.get('x-user-permissions')
  const dataPermissionsHeader = request.headers.get('x-data-permissions')

  return {
    userPermissions: userPermissionsHeader ? JSON.parse(userPermissionsHeader) : null,
    dataPermissions: dataPermissionsHeader ? JSON.parse(dataPermissionsHeader) : null
  }
}
