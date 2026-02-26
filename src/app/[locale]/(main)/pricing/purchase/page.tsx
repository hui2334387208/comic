import { Suspense } from 'react'
import ClientPurchasePage from './ClientPurchasePage'

export const metadata = {
  title: '购买套餐',
  description: '选择购买方式完成充值',
}

export default function PurchasePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    }>
      <ClientPurchasePage />
    </Suspense>
  )
}
