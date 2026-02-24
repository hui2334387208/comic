import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import ClientComicListPage from './ClientComicListPage'
import { routing } from '@/i18n/routing'
import { fetchMenuByPath } from '@/server/menus'
import { fetchComicListForServer } from '@/server/comics'
import { fetchComicCategoriesForServer } from '@/server/categories'
import { fetchComicTagsForServer } from '@/server/tags'

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
  
  // 拉取漫画列表
  const comicData = await fetchComicListForServer({
    page: initialPage,
    limit: 12,
    sort: initialSort,
    category: initialCategory === 'all' ? null : initialCategory,
    search: initialSearch || null,
    language: locale,
  })
  
  // 处理数据，确保类型正确
  const comics = (comicData?.data?.comics || []).map((comic: any) => ({
    id: comic.id,
    title: comic.title || '',
    description: comic.description || '',
    authorId: comic.authorId,
    author: comic.author?.name || comic.author?.username || '未知',
    category: comic.category,
    coverImage: comic.coverImage,
    volumeCount: comic.volumeCount || 0,
    episodeCount: comic.episodeCount || 0,
    viewCount: comic.viewCount || 0,
    likeCount: comic.likeCount || 0,
    createdAt: comic.createdAt,
    tags: comic.tags || [],  // 直接使用完整的tag对象数组
    style: comic.style,
    contents: [],
  }))
  
  const totalPages = comicData?.data?.pagination?.totalPages || 1
  
  // 拉取分类
  const categoriesData = await fetchComicCategoriesForServer()
  const categories = [
    { id: 0, name: '全部', slug: 'all', count: undefined },
    ...categoriesData.map((c: any) => ({
      id: c.id,
      name: c.name || '',
      slug: c.slug,
      icon: c.icon,
      color: c.color,
      count: undefined,
    })),
  ]
  
  // 拉取标签
  const tagsData = await fetchComicTagsForServer()
  const tags = tagsData.map((t: any) => ({
    id: t.id,
    name: t.name || '',
    slug: t.slug,
    color: t.color,
  }))
  
  return (
    <ClientComicListPage
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

