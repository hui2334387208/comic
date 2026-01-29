import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import ClientCreateBattlePage from './ClientCreateBattlePage'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('social.battles')
  
  return {
    title: t('create.title'),
    description: t('create.description'),
  }
}

export default function CreateBattlePage() {
  return <ClientCreateBattlePage />
}