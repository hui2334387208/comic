import { Metadata } from 'next'

import ClientVipPlansPage from './ClientVipPlansPage'
import { routing } from '@/i18n/routing';
import { fetchMenuByPath } from '@/server/menus'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  try {
    const { locale = 'en' } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    const menu = await fetchMenuByPath('/vip/plans', locale)
    if (!menu) {
      return {
        title: 'VIP会员计划 - 文鳐 Couplet',
        description: '选择最适合您的VIP会员计划，解锁更多专属权益',
      }
    }
    const title = menu.metaTitle || menu.name || 'VIP会员计划 - 文鳐 Couplet'
    const description = menu.metaDescription || '选择最适合您的VIP会员计划，解锁更多专属权益'
    const keywords = menu.metaKeywords || 'VIP, 会员, 计划, 对联, 文鳐'
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
        canonical: locale === routing.defaultLocale ? `${baseUrl}/vip/plans` : `${baseUrl}/${locale}/vip/plans`,
        languages: {
          ...Object.fromEntries(
            Array.from(routing.locales).map((lang: string) =>
              lang === routing.defaultLocale
                ? [lang, `${baseUrl}/vip/plans`]
                : [lang, `${baseUrl}/${lang}/vip/plans`]
            )
          ),
          'x-default': `${baseUrl}/vip/plans`,
        },
      },
    }
  } catch (error) {
    console.error('Error fetching menu:', error)
    return {}
  }
}

export default function VipPlansPage() {
  return <ClientVipPlansPage />
}
