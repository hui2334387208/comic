'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface PermissionOptions {
  permission?: string
  permissions?: string[]
  role?: string
  roles?: string[]
  requireAll?: boolean // true=AND逻辑, false=OR逻辑
}

export function withPagePermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: string | PermissionOptions
) {
  return function PageWithPermission(props: P) {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(true)

    // 处理参数，支持字符串或对象
    const permissionOptions = typeof options === 'string'
      ? { permission: options }
      : options

    useEffect(() => {
      const checkPermission = async () => {
        // 等待session加载完成
        if (status === 'loading') {
          setLoading(true)
          return
        }
        
        // session加载完成但用户未登录
        if (status === 'unauthenticated' || !session?.user?.id) {
          router.push('/admin/sign-in')
          return
        }

        try {
          // 获取用户权限和角色
          const response = await fetch('/api/admin/user-permissions')
          const result = await response.json()

          if (result.success) {
            const { permissions: userPermissions, roles: userRoles } = result
            const { requireAll = false } = permissionOptions

            let hasAccess = true

            // 检查权限
            if (permissionOptions.permission) {
              hasAccess = hasAccess && userPermissions.includes(permissionOptions.permission)
            }

            if (permissionOptions.permissions && permissionOptions.permissions.length > 0) {
              if (requireAll) {
                // AND逻辑：需要所有权限
                hasAccess = hasAccess && permissionOptions.permissions.every(p => userPermissions.includes(p))
              } else {
                // OR逻辑：需要任意一个权限
                hasAccess = hasAccess && permissionOptions.permissions.some(p => userPermissions.includes(p))
              }
            }

            // 检查角色
            if (permissionOptions.role) {
              hasAccess = hasAccess && userRoles.includes(permissionOptions.role)
            }

            if (permissionOptions.roles && permissionOptions.roles.length > 0) {
              if (requireAll) {
                // AND逻辑：需要所有角色
                hasAccess = hasAccess && permissionOptions.roles.every(r => userRoles.includes(r))
              } else {
                // OR逻辑：需要任意一个角色
                hasAccess = hasAccess && permissionOptions.roles.some(r => userRoles.includes(r))
              }
            }

            if (!hasAccess) {
              router.push('/403')
            }
          } else {
            router.push('/403')
          }
        } catch (error) {
          router.push('/403')
        } finally {
          setLoading(false)
        }
      }

      checkPermission()
    }, [session, status, permissionOptions, router])

    if (loading) {
      return <div>加载中...</div>
    }

    return <WrappedComponent {...props} />
  }
}

export default withPagePermission
