import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import ClientVotePage from './ClientVotePage'

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
    title: t('vote.title'),
    description: t('vote.description'),
  }
}

export default async function VotePage({ params }: Props) {
  const { id } = await params;
  return <ClientVotePage battleId={id} />
}