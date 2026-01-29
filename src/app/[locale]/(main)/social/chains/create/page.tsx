import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientCreateChainPage from './ClientCreateChainPage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? '创建接龙 - 文鳐对联' : 'Create Chain - Wenray Couplet'
    const description = locale === 'zh' 
      ? '创建新的对联接龙游戏，设置起始句和规则'
      : 'Create a new couplet chain game, set starting line and rules'
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
      alternates: {
        canonical: locale === routing.defaultLocale ? `${baseUrl}/social/chains/create` : `${baseUrl}/${locale}/social/chains/create`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function CreateChainPageServer({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = routing.defaultLocale } = await params

  return <ClientCreateChainPage />
}