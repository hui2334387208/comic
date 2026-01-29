import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientCollaborationsPage from './ClientCollaborationsPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? '协作创作 - 玄鲸对联' : 'Collaborative Creation - Xuanwhale Couplet'
    const description = locale === 'zh' 
      ? '参与协作创作项目，众人拾柴火焰高，集思广益创佳联，合作共赢展才华'
      : 'Join collaborative creation projects, work together to create excellent couplets'
    
    return {
      title,
      description,
      keywords: locale === 'zh' 
        ? '协作创作, 合作创作, 对联创作, 团队合作'
        : 'collaborative creation, cooperative creation, couplet creation, teamwork',
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
        canonical: locale === routing.defaultLocale ? `${baseUrl}/social/collaborations` : `${baseUrl}/${locale}/social/collaborations`,
        languages: {
          ...Object.fromEntries(
            Array.from(routing.locales).map((lang: string) =>
              lang === routing.defaultLocale
                ? [lang, `${baseUrl}/social/collaborations`]
                : [lang, `${baseUrl}/${lang}/social/collaborations`]
            )
          ),
          'x-default': `${baseUrl}/social/collaborations`,
        },
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function CollaborationsPageServer({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = routing.defaultLocale } = await params

  return <ClientCollaborationsPage />
}