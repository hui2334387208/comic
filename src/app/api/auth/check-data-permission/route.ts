import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { checkUserDataPermission } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        hasAccess: false,
        error: '未授权访问'
      }, { status: 401 })
    }

    const body = await request.json()
    const { resource, action = 'read' } = body

    if (!resource) {
      return NextResponse.json({
        hasAccess: false,
        error: '缺少资源参数'
      }, { status: 400 })
    }

    const result = await checkUserDataPermission(session.user.id, resource, action)
    
    return NextResponse.json({
      hasAccess: result.hasAccess,
      dataScope: result.dataScope,
      allowedFields: result.allowedFields,
      conditions: result.conditions
    })

  } catch (error) {
    console.error('Data permission check API error:', error)
    return NextResponse.json({
      hasAccess: false,
      error: '数据权限检查失败'
    }, { status: 500 })
  }
}
