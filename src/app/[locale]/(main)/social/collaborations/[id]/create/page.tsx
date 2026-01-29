import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientParticipateCollaborationPage from './ClientParticipateCollaborationPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale, id } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? `参与创作 - 玄鲸对联` : `Participate in Creation - Xuanwhale Couplet`
    const description = locale === 'zh' 
      ? '参与协作创作，贡献你的创意和才华'
      : 'Participate in collaborative creation and contribute your creativity and talent'
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
      alternates: {
        canonical: locale === routing.defaultLocale ? `${baseUrl}/social/collaborations/${id}/create` : `${baseUrl}/${locale}/social/collaborations/${id}/create`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function ParticipateCollaborationPageServer({ params }: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale = routing.defaultLocale, id } = await params

  return <ClientParticipateCollaborationPage collaborationId={id} />
}