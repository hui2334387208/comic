import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/db'
import { sitemap } from '@/db/schema'
import { publicApiRateLimit } from '@/lib/rate-limit'

// Use the NEXT_PUBLIC_BASE_URL environment variable
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

export async function GET(request: NextRequest) {
  const rateLimit = publicApiRateLimit(request)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: '请求过于频繁，请稍后再试' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfter ?? Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
        },
      },
    )
  }

  // Ensure BASE_URL is set, especially in production
  if (!BASE_URL) {
    console.error('NEXT_PUBLIC_BASE_URL is not defined')
    return NextResponse.json({ error: 'Base URL not configured' }, { status: 500 })
  }

  try {
    const records = await db.select().from(sitemap)
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${records.map(record => `
  <url>
    <loc>${BASE_URL}${record.loc}</loc>
    <lastmod>${record.lastmod instanceof Date ? record.lastmod.toISOString() : record.lastmod}</lastmod>
    <changefreq>${record.changefreq}</changefreq>
    <priority>${record.priority}</priority>
    ${record.hreflang ? `<xhtml:link
      rel="alternate"
      hreflang="${record.hreflang}"
      href="${BASE_URL}${record.loc}"
    />` : ''}
  </url>
`).join('')}
</urlset>`

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return NextResponse.json({ error: 'Failed to generate sitemap' }, { status: 500 })
  }
}
