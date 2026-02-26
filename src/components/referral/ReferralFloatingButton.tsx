'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { GiftOutlined, CloseOutlined } from '@ant-design/icons'

export default function ReferralFloatingButton() {
  const { data: session } = useSession()
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // 检查是否已经关闭过
    const isDismissed = localStorage.getItem('referral_button_dismissed')
    if (isDismissed) {
      setDismissed(true)
      return
    }

    // 延迟3秒显示
    const timer = setTimeout(() => {
      setVisible(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleClick = () => {
    if (session?.user) {
      router.push('/referral')
    } else {
      router.push('/sign-in')
    }
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setVisible(false)
    setDismissed(true)
    localStorage.setItem('referral_button_dismissed', 'true')
  }

  if (dismissed || !visible) return null

  return (
    <div
      className="fixed bottom-6 right-6 z-40 animate-bounce-slow cursor-pointer group"
      onClick={handleClick}
    >
      {/* 关闭按钮 */}
      <button
        onClick={handleDismiss}
        className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-gray-900"
      >
        <CloseOutlined className="text-xs" />
      </button>

      {/* 主按钮 */}
      <div className="relative">
        {/* 光环效果 */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-xl opacity-60 animate-pulse"></div>
        
        {/* 按钮本体 */}
        <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 p-4 w-16 h-16 flex items-center justify-center">
          <GiftOutlined className="text-2xl" />
        </div>

        {/* 提示气泡 */}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="font-bold text-sm">邀请好友，获得奖励 🎁</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            双方都能获得免费次数
          </div>
          {/* 箭头 */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
            <div className="w-0 h-0 border-t-8 border-t-transparent border-l-8 border-l-white dark:border-l-gray-800 border-b-8 border-b-transparent"></div>
          </div>
        </div>

        {/* 新标签 */}
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
          NEW
        </div>
      </div>
    </div>
  )
}
