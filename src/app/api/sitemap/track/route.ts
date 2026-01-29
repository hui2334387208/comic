import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { sitemap } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { url, lastmod, changefreq, priority, hreflang } = await request.json()
    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

    const exists = await db.select().from(sitemap).where(eq(sitemap.loc, url))
    if (exists.length === 0) {
      await db.insert(sitemap).values({
        loc: url,
        lastmod: lastmod ? new Date(lastmod) : new Date(),
        changefreq: changefreq || 'daily',
        priority: priority || '0.5',
        hreflang: hreflang || null,
      })
    } else {
      await db.update(sitemap)
        .set({ lastmod: lastmod ? new Date(lastmod) : new Date(), changefreq, priority, hreflang })
        .where(eq(sitemap.loc, url))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking sitemap:', error)
    return NextResponse.json({ error: 'Failed to track sitemap' }, { status: 500 })
  }
}