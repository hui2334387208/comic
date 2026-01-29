import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientGameLeaderboardPage from './ClientGameLeaderboardPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? '排行榜 - 玄鲸对联' : 'Leaderboard - Xuanwhale Couplet'
    const description = locale === 'zh' 
      ? '多维度排行榜系统，展示创作质量、活跃度、积分等各项排名，与高手一较高下'
      : 'Multi-dimensional leaderboard system showing rankings in creation quality, activity, points and more, compete with masters'
    
    return {
      title,
      description,
      keywords: locale === 'zh' 
        ? '排行榜, 创作质量, 活跃度排名, 积分排行, 竞技'
        : 'leaderboard, creation quality, activity ranking, point ranking, competition',
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
        canonical: locale === routing.defaultLocale ? `${baseUrl}/game/leaderboard` : `${baseUrl}/${locale}/game/leaderboard`,
        languages: {
          ...Object.fromEntries(
            Array.from(routing.locales).map((lang: string) =>
              lang === routing.defaultLocale
                ? [lang, `${baseUrl}/game/leaderboard`]
                : [lang, `${baseUrl}/${lang}/game/leaderboard`]
            )
          ),
          'x-default': `${baseUrl}/game/leaderboard`,
        },
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function GameLeaderboardPageServer({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = routing.defaultLocale } = await params

  return <ClientGameLeaderboardPage />
}