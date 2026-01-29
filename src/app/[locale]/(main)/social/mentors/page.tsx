import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientMentorsPage from './ClientMentorsPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? '导师系统 - 玄鲸对联' : 'Mentor System - Xuanwhale Couplet'
    const description = locale === 'zh' 
      ? '寻找专业对联导师，名师出高徒，拜师学艺道，传承文化薪火相传'
      : 'Find professional couplet mentors, learn from masters, inherit cultural traditions'
    
    return {
      title,
      description,
      keywords: locale === 'zh' 
        ? '对联导师, 拜师学艺, 文化传承, 在线教学'
        : 'couplet mentor, apprenticeship, cultural inheritance, online teaching',
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
        canonical: locale === routing.defaultLocale ? `${baseUrl}/social/mentors` : `${baseUrl}/${locale}/social/mentors`,
        languages: {
          ...Object.fromEntries(
            Array.from(routing.locales).map((lang: string) =>
              lang === routing.defaultLocale
                ? [lang, `${baseUrl}/social/mentors`]
                : [lang, `${baseUrl}/${lang}/social/mentors`]
            )
          ),
          'x-default': `${baseUrl}/social/mentors`,
        },
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function MentorsPageServer({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = routing.defaultLocale } = await params

  return <ClientMentorsPage />
}