import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'

import ClientComicDetailPage from './ClientComicDetailPage'
import { fetchComicDetailForServer } from '@/server/comic-detail'
import { fetchComicVersionsForServer } from '@/server/comic-versions'

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }): Promise<Metadata> {
  try {
    const { id, locale = routing.defaultLocale } = await params
    const t = await getTranslations('main.seo.comic')
    
    if (id === 'new') {
      return {
        title: t('generating'),
        description: t('generatingDesc'),
      }
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    const result = await fetchComicDetailForServer(Number(id))
    
    if (!result?.success || !result.data) {
      return {
        title: t('notFound'),
        description: t('notFoundDesc'),
      }
    }
    
    const comic = result.data
    const title = `${comic.title || t('defaultTitle')} - ${t('siteName')}`
    const description = comic.description || t('defaultDesc')
    const keywords = Array.isArray(comic.tags)
      ? comic.tags.map((tag: any) => tag.name).join(', ')
      : t('defaultKeywords')
    
    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        type: 'article',
        images: comic.coverImage ? [comic.coverImage] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: comic.coverImage ? [comic.coverImage] : undefined,
      },
      alternates: {
        canonical: locale === routing.defaultLocale 
          ? `${baseUrl}/comic/${comic.category?.slug || 'category'}/${encodeURIComponent(comic.prompt || 'prompt')}/${comic.id}`
          : `${baseUrl}/${locale}/comic/${comic.category?.slug || 'category'}/${encodeURIComponent(comic.prompt || 'prompt')}/${comic.id}`,
        languages: {
          ...Object.fromEntries(
            Array.from(routing.locales).map((lang: string) =>
              lang === routing.defaultLocale
                ? [lang, `${baseUrl}/comic/${comic.category?.slug || 'category'}/${encodeURIComponent(comic.prompt || 'prompt')}/${comic.id}`]
                : [lang, `${baseUrl}/${lang}/comic/${comic.category?.slug || 'category'}/${encodeURIComponent(comic.prompt || 'prompt')}/${comic.id}`]
            )
          ),
          'x-default': `${baseUrl}/comic/${comic.category?.slug || 'category'}/${encodeURIComponent(comic.prompt || 'prompt')}/${comic.id}`,
        },
      },
    }
  } catch (error) {
    console.error('Error fetching comic:', error)
    return {}
  }
}

export default async function Page({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale = routing.defaultLocale } = await params
  const t = await getTranslations({ locale, namespace: 'main.comic.detail' })

  if (id === 'new') {
    return (
      <ClientComicDetailPage
        comic={null}
        versions={[]}
        currentVersion={null}
        comicId={id}
      />
    )
  }

  const [comicResult, versionsResult] = await Promise.all([
    fetchComicDetailForServer(Number(id)),
    fetchComicVersionsForServer(Number(id)),
  ])
  
  const apiComic = comicResult?.success ? comicResult.data : null
  const comic = apiComic ? {
    id: String(apiComic.id),
    title: apiComic.title || t('noTitle'),
    description: apiComic.description || t('noDescription'),
    category: {
      name: apiComic.category?.name || t('uncategorized'),
      icon: apiComic.category?.icon || undefined,
      slug: apiComic.category?.slug,
    },
    prompt: apiComic.prompt ?? '',
    model: apiComic.model || '',
    style: apiComic.style || '',
    coverImage: apiComic.coverImage || '',
    volumeCount: apiComic.volumeCount || 0,
    episodeCount: apiComic.episodeCount || 0,
    createdAt: apiComic.createdAt?.toISOString() || '',
    volumes: apiComic.volumes?.map((volume: any) => ({
      id: volume.id,
      volumeNumber: volume.volumeNumber,
      title: volume.title,
      description: volume.description,
      episodeCount: volume.episodeCount,
      episodes: volume.episodes?.map((episode: any) => ({
        id: episode.id,
        episodeNumber: episode.episodeNumber,
        title: episode.title,
        description: episode.description,
        pageCount: episode.pageCount,
        pages: episode.pages?.map((page: any) => ({
          id: page.id,
          pageNumber: page.pageNumber,
          pageLayout: page.pageLayout || '',
          panelCount: page.panelCount || 0,
          imageUrl: page.imageUrl || '',
          status: page.status || 'pending',
          panels: page.panels || []
        })) || []
      })) || []
    })) || [],
    tags: Array.isArray(apiComic.tags) ? apiComic.tags : [],
  } : null
  
  const versions = versionsResult?.success ? versionsResult.data?.versions?.map((v: any) => ({
    ...v,
    parentVersionId: v.parentVersionId ?? undefined,
    versionDescription: v.versionDescription ?? undefined,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  })) || [] : []
  const currentVersion = versions.find((v: any) => v.isLatestVersion) || versions[0] || null
  
  return (
    <ClientComicDetailPage
      comic={comic}
      versions={versions}
      currentVersion={currentVersion}
      comicId={id}
    />
  )
}