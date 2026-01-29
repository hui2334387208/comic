import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import ClientSubmitCoupletPage from './ClientSubmitCoupletPage'

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
    title: t('submit.title'),
    description: t('submit.description'),
  }
}

export default async function SubmitCoupletPage({ params }: Props) {
  const { id } = await params;
  return <ClientSubmitCoupletPage battleId={id} />
}