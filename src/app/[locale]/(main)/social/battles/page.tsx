import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientBattlesPage from './ClientBattlesPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? '对联PK比赛 - 文鳐对联' : 'Couplet Battles - Wenray Couplet'
    const description = locale === 'zh' 
      ? '参与激烈的对联PK比赛，与文人雅士一决高下，展现你的诗词才华'
      : 'Join intense couplet battles, compete with literary scholars, showcase your poetic talent'
    
    return {
      title,
      description,
      keywords: locale === 'zh' 
        ? '对联PK, 诗词比赛, 文学竞技, 对联创作'
        : 'couplet battle, poetry competition, literary contest, couplet creation',
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
        canonical: locale === routing.defaultLocale ? `${baseUrl}/social/battles` : `${baseUrl}/${locale}/social/battles`,
        languages: {
          ...Object.fromEntries(
            Array.from(routing.locales).map((lang: string) =>
              lang === routing.defaultLocale
                ? [lang, `${baseUrl}/social/battles`]
                : [lang, `${baseUrl}/${lang}/social/battles`]
            )
          ),
          'x-default': `${baseUrl}/social/battles`,
        },
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function BattlesPageServer({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = routing.defaultLocale } = await params

  return <ClientBattlesPage />
}