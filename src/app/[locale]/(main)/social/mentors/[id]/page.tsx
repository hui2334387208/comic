import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientMentorDetailPage from './ClientMentorDetailPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale, id } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? `导师详情 - 玄鲸对联` : `Mentor Details - Xuanwhale Couplet`
    const description = locale === 'zh' 
      ? '查看导师详细信息，申请学习指导'
      : 'View mentor details and apply for learning guidance'
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
      alternates: {
        canonical: locale === routing.defaultLocale ? `${baseUrl}/social/mentors/${id}` : `${baseUrl}/${locale}/social/mentors/${id}`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function MentorDetailPageServer({ params }: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale = routing.defaultLocale, id } = await params

  return <ClientMentorDetailPage mentorId={id} />
}