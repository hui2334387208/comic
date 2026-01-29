import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'

import ClientCoupletPage from './ClientCoupletPage'
import { fetchCoupletDetailForServer } from '@/server/couplet-detail'
import { fetchCoupletVersionsForServer } from '@/server/couplet-versions'

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }): Promise<Metadata> {
  try {
    const { id, locale = routing.defaultLocale } = await params
    const t = await getTranslations('main.seo.couplet')
    
    if (id === 'new') {
      return {
        title: t('generating'),
        description: t('generatingDesc'),
      }
    }
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    const result = await fetchCoupletDetailForServer(Number(id), null)
    if (!result?.success || !result.data) {
      return {
        title: t('notFound'),
        description: t('notFoundDesc'),
      }
    }
    const couplet = result.data
    // Use the first content's upperLine as title, or fallback to the couplet title
    const firstContent = couplet.contents?.[0]
    const title = `${firstContent?.upperLine || t('defaultTitle')} - ${t('siteName')}`
    const description = firstContent?.lowerLine || t('defaultDesc')
    const keywords = Array.isArray(couplet.tags)
      ? couplet.tags.map((t: any) => t.name).join(', ')
      : t('defaultKeywords')
    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      alternates: {
        canonical: locale === routing.defaultLocale 
          ? `${baseUrl}/couplet/${couplet.category?.slug || 'category'}/${encodeURIComponent(couplet.prompt || 'prompt')}/${couplet.id}`
          : `${baseUrl}/${locale}/couplet/${couplet.category?.slug || 'category'}/${encodeURIComponent(couplet.prompt || 'prompt')}/${couplet.id}`,
        languages: {
          ...Object.fromEntries(
            Array.from(routing.locales).map((lang: string) =>
              lang === routing.defaultLocale
                ? [lang, `${baseUrl}/couplet/${couplet.category?.slug || 'category'}/${encodeURIComponent(couplet.prompt || 'prompt')}/${couplet.id}`]
                : [lang, `${baseUrl}/${lang}/couplet/${couplet.category?.slug || 'category'}/${encodeURIComponent(couplet.prompt || 'prompt')}/${couplet.id}`]
            )
          ),
          'x-default': `${baseUrl}/couplet/${couplet.category?.slug || 'category'}/${encodeURIComponent(couplet.prompt || 'prompt')}/${couplet.id}`,
        },
      },
    }
  } catch (error) {
    console.error('Error fetching couplet:', error)
    return {}
  }
}

export default async function Page({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale = routing.defaultLocale } = await params
  const t = await getTranslations({ locale, namespace: 'main.couplet.detail' })

  if (id === 'new') {
    return (
      <ClientCoupletPage
        couplet={null}
        versions={[]}
        currentVersion={null}
        coupletId={id}
      />
    )
  }

  const [coupletResult, versionsResult] = await Promise.all([
    fetchCoupletDetailForServer(Number(id), null),
    fetchCoupletVersionsForServer(Number(id)),
  ])
  const apiCouplet = (coupletResult as any)?.data
  const couplet =
    apiCouplet && Array.isArray(apiCouplet.contents)
      ? {
          id: String(apiCouplet.id),
          title: apiCouplet.title || t('noTitle'),
          description: apiCouplet.description || t('noDescription'),
          category: {
            name: apiCouplet.category?.name || t('uncategorized'),
            icon: apiCouplet.category?.icon,
            slug: apiCouplet.category?.slug,
          },
          prompt: apiCouplet.prompt ?? '',
          model: apiCouplet.model || '',
          createdAt: apiCouplet.createdAt || '',
          contents:
            apiCouplet.contents?.map((content: any) => {
              // 对联数据格式：API返回的upperLine是上联，lowerLine是下联，horizontalScroll是横批
              return {
                id: content.id,
                upperLine: content.upperLine || '', // 上联
                lowerLine: content.lowerLine || '', // 下联
                horizontalScroll: content.horizontalScroll || '', // 横批
                appreciation: content.appreciation || '', // 赏析内容
              }
            }) || [],
          tags: Array.isArray(apiCouplet.tags) ? apiCouplet.tags : [],
        }
      : null
  const versions = (versionsResult as any)?.data?.versions || []
  const currentVersion = versions.find((v: any) => v.isLatestVersion) || versions[0] || null
  return (
    <ClientCoupletPage
      couplet={couplet}
      versions={versions}
      currentVersion={currentVersion}
      coupletId={id}
    />
  )
}

