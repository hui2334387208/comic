import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getUserPermissionsFromDB } from '@/lib/permissions'
import { requirePermission } from '@/lib/permission-middleware'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // 权限检查
    const permissionCheck = await requirePermission('user.read')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: '未登录'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // 如果指定了userId，获取该用户的完整权限信息
    if (userId) {
      const userPermissions = await getUserPermissionsFromDB(userId)
      return NextResponse.json({
        success: true,
        permissions: userPermissions.permissions, // 最终权限列表
        roles: userPermissions.roles, // 用户角色列表
        directPermissions: userPermissions.directPermissions, // 直接权限
        restrictedPermissions: userPermissions.restrictedPermissions, // 限制权限
        dataScope: userPermissions.dataScope
      })
    }

    // 否则获取当前用户的权限和角色（包含直接权限和角色权限）
    const userPermissions = await getUserPermissionsFromDB(session.user.id)

    return NextResponse.json({
      success: true,
      permissions: userPermissions.permissions, // 最终权限列表
      roles: userPermissions.roles, // 用户角色列表
      directPermissions: userPermissions.directPermissions, // 直接权限
      restrictedPermissions: userPermissions.restrictedPermissions, // 限制权限
      dataScope: userPermissions.dataScope
    })
  } catch (error) {
    console.error('获取用户权限失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取权限失败'
    }, { status: 500 })
  }
}