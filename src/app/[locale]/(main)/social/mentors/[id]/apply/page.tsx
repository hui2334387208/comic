import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientApplyMentorPage from './ClientApplyMentorPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale, id } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? `申请指导 - 玄鲸对联` : `Apply for Mentorship - Xuanwhale Couplet`
    const description = locale === 'zh' 
      ? '申请导师指导，提升对联创作技能'
      : 'Apply for mentor guidance to improve couplet creation skills'
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
      alternates: {
        canonical: locale === routing.defaultLocale ? `${baseUrl}/social/mentors/${id}/apply` : `${baseUrl}/${locale}/social/mentors/${id}/apply`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function ApplyMentorPageServer({ params }: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale = routing.defaultLocale, id } = await params

  return <ClientApplyMentorPage mentorId={id} />
}