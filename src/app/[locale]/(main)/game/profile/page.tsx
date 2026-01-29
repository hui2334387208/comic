import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientGameProfilePage from './ClientGameProfilePage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? `游戏档案 - 玄鲸对联` : `Game Profile - Xuanwhale Couplet`
    const description = locale === 'zh' 
      ? '查看个人游戏统计、成就进度、关卡记录和积分历史'
      : 'View personal game statistics, achievement progress, level records and point history'
    
    return {
      title,
      description,
      keywords: locale === 'zh' 
        ? '游戏档案, 个人统计, 成就进度, 积分历史'
        : 'game profile, personal stats, achievement progress, point history',
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
        canonical: locale === routing.defaultLocale ? `${baseUrl}/game/profile` : `${baseUrl}/${locale}/game/profile`,
        languages: {
          ...Object.fromEntries(
            Array.from(routing.locales).map((lang: string) =>
              lang === routing.defaultLocale
                ? [lang, `${baseUrl}/game/profile`]
                : [lang, `${baseUrl}/${lang}/game/profile`]
            )
          ),
          'x-default': `${baseUrl}/game/profile`,
        },
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function GameProfilePageServer({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = routing.defaultLocale } = await params

  return <ClientGameProfilePage />
}