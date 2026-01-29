import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientBecomeMentorPage from './ClientBecomeMentorPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? '申请成为导师 - 文鳐对联' : 'Become a Mentor - Wenray Couplet'
    const description = locale === 'zh' 
      ? '申请成为对联导师，分享你的知识和经验，传承中华文化'
      : 'Apply to become a couplet mentor, share your knowledge and experience, inherit Chinese culture'
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
      alternates: {
        canonical: locale === routing.defaultLocale ? `${baseUrl}/social/mentors/become` : `${baseUrl}/${locale}/social/mentors/become`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function BecomeMentorPageServer({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = routing.defaultLocale } = await params

  return <ClientBecomeMentorPage />
}