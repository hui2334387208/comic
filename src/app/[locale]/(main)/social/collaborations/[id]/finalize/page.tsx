import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientFinalizeCollaborationPage from './ClientFinalizeCollaborationPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale, id } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? `完善作品 - 玄鲸对联` : `Finalize Work - Xuanwhale Couplet`
    const description = locale === 'zh' 
      ? '完善协作作品，进行最后的润色和修改'
      : 'Finalize collaborative work with final polishing and modifications'
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
      alternates: {
        canonical: locale === routing.defaultLocale ? `${baseUrl}/social/collaborations/${id}/finalize` : `${baseUrl}/${locale}/social/collaborations/${id}/finalize`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function FinalizeCollaborationPageServer({ params }: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale = routing.defaultLocale, id } = await params

  return <ClientFinalizeCollaborationPage collaborationId={id} />
}