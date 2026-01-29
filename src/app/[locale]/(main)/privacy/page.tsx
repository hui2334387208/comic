import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import ClientPrivacyPage from './ClientPrivacyPage'
import { routing } from '@/i18n/routing';
import { fetchMenuByPath } from '@/server/menus'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    const menu = await fetchMenuByPath('/privacy', locale)
    const t = await getTranslations('main.seo.privacy')
    
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
        canonical: locale === routing.defaultLocale ? `${baseUrl}/privacy` : `${baseUrl}/${locale}/privacy`,
        languages: {
          ...Object.fromEntries(
            Array.from(routing.locales).map((lang: string) =>
              lang === routing.defaultLocale
                ? [lang, `${baseUrl}/privacy`]
                : [lang, `${baseUrl}/${lang}/privacy`]
            )
          ),
          'x-default': `${baseUrl}/privacy`,
        },
      },
    }
  } catch (error) {
    console.error('Error fetching menu:', error)
    return {}
  }
}

export default function PrivacyPageServer() {
  return <ClientPrivacyPage />
}
