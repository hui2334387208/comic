import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import ClientCoupletListPage from './ClientComicListPage'
import { routing } from '@/i18n/routing'
import { fetchMenuByPath } from '@/server/menus'
import { fetchCoupletListForServer } from '@/server/couplets'
import { fetchCoupletCategoriesForServer } from '@/server/categories'
import { fetchCoupletTagsForServer } from '@/server/tags'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    const menu = await fetchMenuByPath('/comic', locale)
    const t = await getTranslations('main.seo.comic')
    
    if (!menu) {
      return {
        title: t('title') || 'AI漫画创作平台',
        description: t('description') || '探索AI生成的精彩漫画世界',
      }
    }
    const title = menu.metaTitle || menu.name || t('title') || 'AI漫画创作平台'
    const description = menu.metaDescription || t('description') || '探索AI生成的精彩漫画世界'
    const keywords = menu.metaKeywords || t('keywords') || 'AI漫画,人工智能,漫画创作,在线漫画'
    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      alternates: {
        canonical: locale === routing.defaultLocale ? `${baseUrl}/comic` : `${baseUrl}/${locale}/comic`,
        languages: {
          ...Object.fromEntries(
            Array.from(routing.locales).map((lang: string) =>
              lang === routing.defaultLocale
                ? [lang, `${baseUrl}/comic`]
                : [lang, `${baseUrl}/${lang}/comic`]
            )
          ),
          'x-default': `${baseUrl}/comic`,
        },
      },
    }
  } catch (error) {
    console.error('Error fetching menu:', error)
    return {}
  }
}

export default async function ComicListPageServer({ params }: { params: Promise<{ locale: string }> }) {
  const { locale = routing.defaultLocale } = await params
  // 默认第一页、最新、全部分类、无搜索
  const initialPage = 1
  const initialSort: 'latest' | 'hot' | 'contents' = 'latest'
  const initialCategory = 'all'
  const initialSearch = ''
  
  // 拉取漫画列表 (使用现有的对联API作为数据源)
  const comicData = await fetchCoupletListForServer({
    page: initialPage,
    limit: 12,
    sort: initialSort,
    category: initialCategory === 'all' ? null : initialCategory,
    search: initialSearch || null,
    language: locale,
  })
  
  const comics = (comicData?.data?.couplets || []).map((item: any) => ({
    id: item.id,
    title: item.title || '',
    description: item.description || '',
    authorId: item.authorId,
    author: item.author?.name || item.author?.username || '未知',
    category: item.category || {},
    coverImage: item.coverImage,
    frameCount: item.contentCount || 4, // 将contentCount映射为frameCount
    viewCount: item.viewCount,
    likeCount: item.likeCount,
    createdAt: item.createdAt,
    tags: Array.isArray(item.tags) ? item.tags.map((t: any) => t.name || t) : [],
    style: item.model || 'manga', // 将model映射为style
    type: item.type,
    contents: item.contents || [],
  }))
  
  const totalPages = comicData?.data?.pagination?.totalPages || 1
  
  // 拉取分类
  const categoriesData = await fetchCoupletCategoriesForServer()
  const categories = [
    { id: 0, name: '全部', slug: 'all', count: undefined },
    ...categoriesData.map((c: any) => ({
      id: c.id,
      name: c.name || '',
      slug: c.slug,
      count: undefined,
    })),
  ]
  
  // 拉取标签
  const tagsData = await fetchCoupletTagsForServer()
  const tags = tagsData.map((t: any) => ({
    id: t.id,
    name: t.name || '',
    slug: t.slug,
  }))
  
  return (
    <ClientCoupletListPage
      comics={comics}
      categories={categories}
      tags={tags}
      totalPages={totalPages}
      initialPage={initialPage}
      initialSort={initialSort}
      initialCategory={initialCategory}
      initialSearch={initialSearch}
    />
  )
}

