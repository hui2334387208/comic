import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientSocialPage from './ClientSocialPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? '社交互动 - 文鳐对联' : 'Social Features - Wenray Couplet'
    const description = locale === 'zh' 
      ? '参与对联PK比赛、协作创作、接龙游戏，与导师学习，体验丰富的社交互动功能'
      : 'Join couplet battles, collaborative creation, chain games, learn with mentors, and experience rich social features'
    
    return {
      title,
      description,
      keywords: locale === 'zh' 
        ? '对联PK, 协作创作, 对联接龙, 导师系统, 社交互动'
        : 'couplet battle, collaboration, chain game, mentor system, social interaction',
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
        canonical: locale === routing.defaultLocale ? `${baseUrl}/social` : `${baseUrl}/${locale}/social`,
        languages: {
          ...Object.fromEntries(
            Array.from(routing.locales).map((lang: string) =>
              lang === routing.defaultLocale
                ? [lang, `${baseUrl}/social`]
                : [lang, `${baseUrl}/${lang}/social`]
            )
          ),
          'x-default': `${baseUrl}/social`,
        },
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function SocialPageServer({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = routing.defaultLocale } = await params

  return <ClientSocialPage />
}