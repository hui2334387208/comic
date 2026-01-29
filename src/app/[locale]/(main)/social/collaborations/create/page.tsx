import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientCreateCollaborationPage from './ClientCreateCollaborationPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? '发起协作 - 文鳐对联' : 'Create Collaboration - Wenray Couplet'
    const description = locale === 'zh' 
      ? '发起新的协作创作项目，邀请他人共同创作对联'
      : 'Create a new collaborative creation project and invite others to create couplets together'
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
      alternates: {
        canonical: locale === routing.defaultLocale ? `${baseUrl}/social/collaborations/create` : `${baseUrl}/${locale}/social/collaborations/create`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function CreateCollaborationPageServer({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = routing.defaultLocale } = await params

  return <ClientCreateCollaborationPage />
}