import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { revokeUserPermission } from '@/lib/permission-utils'
import { requirePermission } from '@/lib/permission-middleware'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // 权限检查
    const permissionCheck = await requirePermission('user.update')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: '未登录'
      }, { status: 401 })
    }

    const { userId, permissionId } = await request.json()

    if (!userId || !permissionId) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { status: 400 })
    }

    // 撤销权限
    await revokeUserPermission(userId, permissionId)

    return NextResponse.json({
      success: true,
      message: '权限撤销成功'
    })
  } catch (error) {
    console.error('撤销权限失败:', error)
    return NextResponse.json({
      success: false,
      error: '撤销权限失败'
    }, { status: 500 })
  }
}
