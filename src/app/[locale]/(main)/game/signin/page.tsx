import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientGameSigninPage from './ClientGameSigninPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? '每日签到 - 玄鲸对联' : 'Daily Check-in - Xuanwhale Couplet'
    const description = locale === 'zh' 
      ? '每日签到获得积分奖励，连续签到获得额外奖励，坚持学习获得更多收益'
      : 'Daily check-in to earn points, consecutive check-ins for extra rewards, consistent learning for more benefits'
    
    return {
      title,
      description,
      keywords: locale === 'zh' 
        ? '每日签到, 积分奖励, 连续签到, 学习奖励'
        : 'daily check-in, point rewards, consecutive check-in, learning rewards',
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
        canonical: locale === routing.defaultLocale ? `${baseUrl}/game/signin` : `${baseUrl}/${locale}/game/signin`,
        languages: {
          ...Object.fromEntries(
            Array.from(routing.locales).map((lang: string) =>
              lang === routing.defaultLocale
                ? [lang, `${baseUrl}/game/signin`]
                : [lang, `${baseUrl}/${lang}/game/signin`]
            )
          ),
          'x-default': `${baseUrl}/game/signin`,
        },
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function GameSigninPageServer({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = routing.defaultLocale } = await params

  return <ClientGameSigninPage />
}