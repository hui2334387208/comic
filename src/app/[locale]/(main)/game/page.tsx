import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientGamePage from './ClientGamePage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? '游戏闯关 - 文鳐对联' : 'Game Challenges - Wenray Couplet'
    const description = locale === 'zh' 
      ? '对联闯关挑战，每日签到积分，排行榜竞技，限时挑战赛，体验丰富的游戏化学习'
      : 'Couplet challenges, daily check-in points, leaderboards, timed contests, experience gamified learning'
    
    return {
      title,
      description,
      keywords: locale === 'zh' 
        ? '对联闯关, 每日签到, 积分系统, 排行榜, 限时挑战'
        : 'couplet challenges, daily check-in, point system, leaderboard, timed challenges',
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
        canonical: locale === routing.defaultLocale ? `${baseUrl}/game` : `${baseUrl}/${locale}/game`,
        languages: {
          ...Object.fromEntries(
            Array.from(routing.locales).map((lang: string) =>
              lang === routing.defaultLocale
                ? [lang, `${baseUrl}/game`]
                : [lang, `${baseUrl}/${lang}/game`]
            )
          ),
          'x-default': `${baseUrl}/game`,
        },
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function GamePageServer({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = routing.defaultLocale } = await params

  return <ClientGamePage />
}