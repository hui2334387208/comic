import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientAddChainEntryPage from './ClientAddChainEntryPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale, id } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? `参与接龙 - 玄鲸对联` : `Join Chain - Xuanwhale Couplet`
    const description = locale === 'zh' 
      ? '参与对联接龙，展示你的诗词才华'
      : 'Join the couplet chain and showcase your poetry talent'
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
      alternates: {
        canonical: locale === routing.defaultLocale ? `${baseUrl}/social/chains/add/${id}` : `${baseUrl}/${locale}/social/chains/add/${id}`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function AddChainEntryPageServer({ params }: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale = routing.defaultLocale, id } = await params

  return <ClientAddChainEntryPage chainId={id} />
}