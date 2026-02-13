import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import ClientHomePage from './ClientHomePage'
import { routing } from '@/i18n/routing'
import { fetchMenuByPath } from '@/server/menus'
import {
  fetchHomeHotComics,
  fetchHomeLatestComics,
  fetchHomeFeaturedComics,
} from '@/server/home'

export async function generateMetadata({ params }: {
  params: Promise<{ id: string, locale: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    const menu = await fetchMenuByPath('/', locale)
    const t = await getTranslations('main.seo.home')
    
    if (!menu) {
      return {
        title: t('title'),
        description: t('description'),
      }
    }
    const title = menu.metaTitle || menu.name || t('title')
    const description = menu.metaDescription || t('description')
    const keywords = menu.metaKeywords || t('keywords')
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
        canonical: locale === routing.defaultLocale ? `${baseUrl}/` : `${baseUrl}/${locale}/`,
        languages: {
          ...Object.fromEntries(
            Array.from(routing.locales).map((lang: string) =>
              lang === routing.defaultLocale
                ? [lang, `${baseUrl}/`]
                : [lang, `${baseUrl}/${lang}/`]
            )
          ),
          'x-default': `${baseUrl}/`,
        },
      },
    }
  } catch (error) {
    console.error('Error fetching menu:', error)
    return {}
  }
}

export default async function HomePageServer({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = routing.defaultLocale } = await params

  const [hotComics, latestComics, featuredComics] = await Promise.all([
    fetchHomeHotComics(locale),
    fetchHomeLatestComics(locale),
    fetchHomeFeaturedComics(locale),
  ])
  
  return (
    <ClientHomePage
      hotComics={Array.isArray(hotComics?.data) ? hotComics.data : []}
      latestComics={Array.isArray(latestComics?.data) ? latestComics.data : []}
      featuredComics={Array.isArray(featuredComics?.data) ? featuredComics.data : []}
    />
  )
}
