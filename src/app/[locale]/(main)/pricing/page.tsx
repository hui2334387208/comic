import { Metadata } from 'next'
import ClientPricingPage from './ClientPricingPage'

export const metadata: Metadata = {
  title: '充值套餐',
  description: '选择适合你的充值套餐，开始创作精彩漫画',
}

export default function PricingPage() {
  return <ClientPricingPage />
}
