import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientGameChallengeDetailPage from './ClientGameChallengeDetailPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale, id } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? `挑战详情 - 玄鲸对联` : `Challenge Details - Xuanwhale Couplet`
    const description = locale === 'zh' 
      ? '参与限时对联创作挑战，展现创作实力，赢取丰厚奖励'
      : 'Join timed couplet creation challenges, showcase your skills, win great rewards'
    
    return {
      title,
      description,
      keywords: locale === 'zh' 
        ? '对联挑战, 限时创作, 竞赛奖励, 排行榜'
        : 'couplet challenge, timed creation, contest rewards, leaderboard',
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
        canonical: locale === routing.defaultLocale ? `${baseUrl}/game/challenges/${id}` : `${baseUrl}/${locale}/game/challenges/${id}`,
        languages: {
          ...Object.fromEntries(
            Array.from(routing.locales).map((lang: string) =>
              lang === routing.defaultLocale
                ? [lang, `${baseUrl}/game/challenges/${id}`]
                : [lang, `${baseUrl}/${lang}/game/challenges/${id}`]
            )
          ),
          'x-default': `${baseUrl}/game/challenges/${id}`,
        },
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function GameChallengeDetailPageServer({ params }: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale = routing.defaultLocale, id } = await params

  return <ClientGameChallengeDetailPage challengeId={id} />
}