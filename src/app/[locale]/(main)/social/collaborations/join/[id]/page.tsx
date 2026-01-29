import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientJoinCollaborationPage from './ClientJoinCollaborationPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale, id } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? `加入协作 - 玄鲸对联` : `Join Collaboration - Xuanwhale Couplet`
    const description = locale === 'zh' 
      ? '加入协作创作项目，与他人共同创作对联'
      : 'Join collaboration project and create couplets together with others'
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
      alternates: {
        canonical: locale === routing.defaultLocale ? `${baseUrl}/social/collaborations/join/${id}` : `${baseUrl}/${locale}/social/collaborations/join/${id}`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function JoinCollaborationPageServer({ params }: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale = routing.defaultLocale, id } = await params

  return <ClientJoinCollaborationPage collaborationId={id} />
}