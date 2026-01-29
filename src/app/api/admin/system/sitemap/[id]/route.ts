import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { sitemap } from '@/db/schema/sitemap'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'

// 获取单个站点地图数据
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: number }> }
) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('sitemap.read')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await context.params
    const record = await db.select().from(sitemap).where(eq(sitemap.id, id))
    
    if (record.length === 0) {
      return NextResponse.json({ error: 'Sitemap not found' }, { status: 404 })
    }
    
    return NextResponse.json(record[0])
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sitemap' }, { status: 500 })
  }
}

// 更新站点地图数据
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: number }> },
) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('sitemap.update')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await context.params
    const { url, lastmod, changefreq, priority, hreflang } = await request.json()
    
    await db.update(sitemap)
      .set({ 
        loc: url,
        lastmod: lastmod ? new Date(lastmod) : new Date(), 
        changefreq, 
        priority, 
        hreflang 
      })
      .where(eq(sitemap.id,id)) 
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update sitemap' }, { status: 500 })
  }
}

// 删除站点地图数据
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: number }> }
) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('sitemap.delete')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await context.params
    await db.delete(sitemap).where(eq(sitemap.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete sitemap' }, { status: 500 })
  }
} 