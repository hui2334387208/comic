import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { checkUserPermission, checkUserAllPermissions, checkUserAnyPermission } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        hasPermission: false,
        error: '未授权访问'
      }, { status: 401 })
    }

    const body = await request.json()
    const { 
      permission, 
      permissions, 
      requireAll = false, 
      role, 
      roles 
    } = body

    // 检查单个权限
    if (permission) {
      const result = await checkUserPermission(session.user.id, permission)
      return NextResponse.json({
        hasPermission: result.hasPermission,
        userRoles: result.userRoles,
        userPermissions: result.userPermissions
      })
    }

    // 检查多个权限
    if (permissions && permissions.length > 0) {
      const result = requireAll 
        ? await checkUserAllPermissions(session.user.id, permissions)
        : await checkUserAnyPermission(session.user.id, permissions)
      
      return NextResponse.json({
        hasPermission: result.hasPermission,
        userRoles: result.userRoles,
        userPermissions: result.userPermissions
      })
    }

    // 检查角色
    if (role) {
      const result = await checkUserPermission(session.user.id, '')
      const hasRole = result.userRoles.includes(role)
      
      return NextResponse.json({
        hasPermission: hasRole,
        userRoles: result.userRoles,
        userPermissions: result.userPermissions
      })
    }

    // 检查多个角色
    if (roles && roles.length > 0) {
      const result = await checkUserPermission(session.user.id, '')
      const hasAnyRole = roles.some((r: string) => result.userRoles.includes(r))
      
      return NextResponse.json({
        hasPermission: hasAnyRole,
        userRoles: result.userRoles,
        userPermissions: result.userPermissions
      })
    }

    return NextResponse.json({
      hasPermission: false,
      error: '缺少权限检查参数'
    }, { status: 400 })

  } catch (error) {
    console.error('Permission check API error:', error)
    return NextResponse.json({
      hasPermission: false,
      error: '权限检查失败'
    }, { status: 500 })
  }
}
