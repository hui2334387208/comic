import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientChainDetailPage from './ClientChainDetailPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale, id } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? `接龙详情 - 玄鲸对联` : `Chain Details - Xuanwhale Couplet`
    const description = locale === 'zh' 
      ? '查看对联接龙详情，参与诗词接龙游戏'
      : 'View couplet chain details and participate in poetry chain games'
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
      alternates: {
        canonical: locale === routing.defaultLocale ? `${baseUrl}/social/chains/${id}` : `${baseUrl}/${locale}/social/chains/${id}`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function ChainDetailPageServer({ params }: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale = routing.defaultLocale, id } = await params

  return <ClientChainDetailPage chainId={id} />
}