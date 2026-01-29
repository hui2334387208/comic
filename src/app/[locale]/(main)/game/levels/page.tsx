import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientGameLevelsPage from './ClientGameLevelsPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? '闯关挑战 - 玄鲸对联' : 'Level Challenges - Xuanwhale Couplet'
    const description = locale === 'zh' 
      ? '挑战不同难度的对联创作关卡，从初级到专家级，逐步提升对联创作技能'
      : 'Challenge couplet creation levels of different difficulties, from beginner to expert, gradually improve couplet writing skills'
    
    return {
      title,
      description,
      keywords: locale === 'zh' 
        ? '对联闯关, 关卡挑战, 难度等级, 创作技能'
        : 'couplet challenges, level challenges, difficulty levels, writing skills',
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
        canonical: locale === routing.defaultLocale ? `${baseUrl}/game/levels` : `${baseUrl}/${locale}/game/levels`,
        languages: {
          ...Object.fromEntries(
            Array.from(routing.locales).map((lang: string) =>
              lang === routing.defaultLocale
                ? [lang, `${baseUrl}/game/levels`]
                : [lang, `${baseUrl}/${lang}/game/levels`]
            )
          ),
          'x-default': `${baseUrl}/game/levels`,
        },
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function GameLevelsPageServer({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = routing.defaultLocale } = await params

  return <ClientGameLevelsPage />
}