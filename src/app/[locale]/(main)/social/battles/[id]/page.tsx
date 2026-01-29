import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import ClientBattleDetailPage from './ClientBattleDetailPage'

interface Props {
  params: Promise<{
    id: string
    locale: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations('social.battles')
  
  return {
    title: t('detail.title'),
    description: t('detail.description'),
  }
}

export default async function BattleDetailPage({ params }: Props) {
  const { id } = await params;
  return <ClientBattleDetailPage battleId={id} />
}