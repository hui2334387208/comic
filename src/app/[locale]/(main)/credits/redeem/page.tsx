import { Metadata } from 'next'
import ClientRedeemPage from './ClientRedeemPage'

export const metadata: Metadata = {
  title: '兑换次数',
  description: '使用兑换码充值生成次数',
}

export default function RedeemPage() {
  return <ClientRedeemPage />
}
