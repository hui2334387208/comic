import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientChainsPage from './ClientChainsPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? '对联接龙 - 文鳐对联' : 'Couplet Chains - Wenray Couplet'
    const description = locale === 'zh' 
      ? '参与对联接龙游戏，诗词接龙乐无穷，上联下联巧相连，妙趣横生展才华'
      : 'Join couplet chain games, enjoy the fun of poetry chains, connect upper and lower couplets cleverly'
    
    return {
      title,
      description,
      keywords: locale === 'zh' 
        ? '对联接龙, 诗词接龙, 文字游戏, 传统文化'
        : 'couplet chain, poetry chain, word game, traditional culture',
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
        canonical: locale === routing.defaultLocale ? `${baseUrl}/social/chains` : `${baseUrl}/${locale}/social/chains`,
        languages: {
          ...Object.fromEntries(
            Array.from(routing.locales).map((lang: string) =>
              lang === routing.defaultLocale
                ? [lang, `${baseUrl}/social/chains`]
                : [lang, `${baseUrl}/${lang}/social/chains`]
            )
          ),
          'x-default': `${baseUrl}/social/chains`,
        },
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function ChainsPageServer({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = routing.defaultLocale } = await params

  return <ClientChainsPage />
}