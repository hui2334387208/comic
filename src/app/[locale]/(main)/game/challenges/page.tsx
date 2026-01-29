import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientGameChallengesPage from './ClientGameChallengesPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? '限时挑战 - 玄鲸对联' : 'Timed Challenges - Xuanwhale Couplet'
    const description = locale === 'zh' 
      ? '参与限时对联创作挑战赛，展现创作实力，赢取丰厚奖励，与高手同台竞技'
      : 'Participate in timed couplet creation challenges, showcase your skills, win rich rewards, compete with masters'
    
    return {
      title,
      description,
      keywords: locale === 'zh' 
        ? '限时挑战, 对联比赛, 创作竞赛, 主题挑战, 奖励'
        : 'timed challenges, couplet competition, creation contest, theme challenge, rewards',
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
        canonical: locale === routing.defaultLocale ? `${baseUrl}/game/challenges` : `${baseUrl}/${locale}/game/challenges`,
        languages: {
          ...Object.fromEntries(
            Array.from(routing.locales).map((lang: string) =>
              lang === routing.defaultLocale
                ? [lang, `${baseUrl}/game/challenges`]
                : [lang, `${baseUrl}/${lang}/game/challenges`]
            )
          ),
          'x-default': `${baseUrl}/game/challenges`,
        },
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function GameChallengesPageServer({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = routing.defaultLocale } = await params

  return <ClientGameChallengesPage />
}