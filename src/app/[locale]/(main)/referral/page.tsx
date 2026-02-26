import { Metadata } from 'next'
import ReferralCard from '@/components/referral/ReferralCard'

export const metadata: Metadata = {
  title: '邀请好友 - 获得免费次数',
  description: '邀请好友注册，双方都能获得免费创作次数奖励',
}

export default function ReferralPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          邀请好友，共享奖励
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          分享你的邀请码，让更多朋友体验AI漫画创作的乐趣
        </p>
      </div>

      <ReferralCard />
    </div>
  )
}
