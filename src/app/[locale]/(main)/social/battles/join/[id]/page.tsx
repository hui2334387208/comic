import { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import ClientJoinBattlePage from './ClientJoinBattlePage'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  try {
    const { locale = routing.defaultLocale, id } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    
    const title = locale === 'zh' ? `参加比赛 - 文鳐对联` : `Join Battle - Wenray Couplet`
    const description = locale === 'zh' 
      ? '参加对联PK比赛，展示你的诗词才华'
      : 'Join the couplet battle and showcase your poetic talent'
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
      alternates: {
        canonical: locale === routing.defaultLocale ? `${baseUrl}/social/battles/join/${id}` : `${baseUrl}/${locale}/social/battles/join/${id}`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function JoinBattlePageServer({ params }: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale = routing.defaultLocale, id } = await params

  return <ClientJoinBattlePage battleId={id} />
}