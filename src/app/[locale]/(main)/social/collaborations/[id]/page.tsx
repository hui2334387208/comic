import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientCollaborationDetailPage from './ClientCollaborationDetailPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale, id } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? `协作详情 - 玄鲸对联` : `Collaboration Details - Xuanwhale Couplet`
    const description = locale === 'zh' 
      ? '查看协作创作项目详情，参与共同创作'
      : 'View collaboration project details and participate in co-creation'
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
      alternates: {
        canonical: locale === routing.defaultLocale ? `${baseUrl}/social/collaborations/${id}` : `${baseUrl}/${locale}/social/collaborations/${id}`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function CollaborationDetailPageServer({ params }: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale = routing.defaultLocale, id } = await params

  return <ClientCollaborationDetailPage collaborationId={id} />
}