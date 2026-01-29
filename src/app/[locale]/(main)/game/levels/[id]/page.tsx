import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientGameLevelDetailPage from './ClientGameLevelDetailPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale, id } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? `关卡挑战 - 玄鲸对联` : `Level Challenge - Xuanwhale Couplet`
    const description = locale === 'zh' 
      ? '挑战对联创作关卡，提升创作技能，获得积分奖励'
      : 'Challenge couplet creation levels, improve writing skills, earn points'
    
    return {
      title,
      description,
      keywords: locale === 'zh' 
        ? '对联关卡, 创作挑战, 积分奖励, 技能提升'
        : 'couplet level, creation challenge, point rewards, skill improvement',
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
        canonical: locale === routing.defaultLocale ? `${baseUrl}/game/levels/${id}` : `${baseUrl}/${locale}/game/levels/${id}`,
        languages: {
          ...Object.fromEntries(
            Array.from(routing.locales).map((lang: string) =>
              lang === routing.defaultLocale
                ? [lang, `${baseUrl}/game/levels/${id}`]
                : [lang, `${baseUrl}/${lang}/game/levels/${id}`]
            )
          ),
          'x-default': `${baseUrl}/game/levels/${id}`,
        },
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function GameLevelDetailPageServer({ params }: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale = routing.defaultLocale, id } = await params

  return <ClientGameLevelDetailPage levelId={id} />
}