import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { sitemap } from '@/db/schema/sitemap'
import { authOptions } from '@/lib/authOptions'
import { requirePermission } from '@/lib/permission-middleware'

// 获取所有站点地图数据
export async function GET(request: NextRequest) {
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

    const records = await db.select().from(sitemap)
    return NextResponse.json({ urls: records })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sitemap' }, { status: 500 })
  }
}

// 创建新的站点地图数据
export async function POST(request: NextRequest) {
  try {
    // 权限检查
    const permissionCheck = await requirePermission('sitemap.create')(request)
    if (permissionCheck) {
      return permissionCheck
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { url, lastmod, changefreq, priority, hreflang } = await request.json()
    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

    const exists = await db.select().from(sitemap).where(eq(sitemap.loc, url))
    if (exists.length > 0) {
      return NextResponse.json({ error: 'URL already exists' }, { status: 400 })
    }

    await db.insert(sitemap).values({
      loc: url,
      lastmod: lastmod ? new Date(lastmod) : new Date(),
      changefreq: changefreq || 'daily',
      priority: priority || 0.5,
      hreflang: hreflang || null,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating sitemap:', error)
    return NextResponse.json({ error: 'Failed to create sitemap' }, { status: 500 })
  }
}
