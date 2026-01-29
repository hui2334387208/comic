import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientQueueMentorPage from './ClientQueueMentorPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale, id } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? `预约排队 - 玄鲸对联` : `Queue for Mentor - Xuanwhale Couplet`
    const description = locale === 'zh' 
      ? '预约导师指导，加入排队等候'
      : 'Queue for mentor guidance and wait for availability'
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
      alternates: {
        canonical: locale === routing.defaultLocale ? `${baseUrl}/social/mentors/${id}/queue` : `${baseUrl}/${locale}/social/mentors/${id}/queue`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function QueueMentorPageServer({ params }: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale = routing.defaultLocale, id } = await params

  return <ClientQueueMentorPage mentorId={id} />
}