import { Metadata } from 'next'

import ClientVipPage from './ClientVipPage'
import { routing } from '@/i18n/routing';
import { fetchMenuByPath } from '@/server/menus'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  try {
    const { locale = 'en' } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    const menu = await fetchMenuByPath('/vip', locale)
    if (!menu) {
      return {
        title: 'VIP会员中心 - 文鳐 Couplet',
        description: '升级VIP会员，享受更多专属权益',
      }
    }
    const title = menu.metaTitle || menu.name || 'VIP会员中心 - 文鳐 Couplet'
    const description = menu.metaDescription || '升级VIP会员，享受更多专属权益'
    const keywords = menu.metaKeywords || 'VIP, 会员, 权益, 对联, 文鳐'
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
        canonical: locale === routing.defaultLocale ? `${baseUrl}/vip` : `${baseUrl}/${locale}/vip`,
        languages: {
          ...Object.fromEntries(
            Array.from(routing.locales).map((lang: string) =>
              lang === routing.defaultLocale
                ? [lang, `${baseUrl}/vip`]
                : [lang, `${baseUrl}/${lang}/vip`]
            )
          ),
          'x-default': `${baseUrl}/vip`,
        },
      },
    }
  } catch (error) {
    console.error('Error fetching menu:', error)
    return {}
  }
}

export default function VipPage() {
  return <ClientVipPage />
}
