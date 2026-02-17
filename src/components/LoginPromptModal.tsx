'use client'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import React from 'react'

interface LoginPromptModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  icon?: string
}

export default function LoginPromptModal({
  isOpen,
  onClose,
  title = '请先登录',
  description = '登录后即可使用此功能',
  icon = '🔐'
}: LoginPromptModalProps) {
  const router = useRouter()
  const locale = useLocale()

  if (!isOpen) return null

  const handleLogin = () => {
    router.push(`/${locale}/sign-in`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative bg-gradient-to-br from-white/95 to-purple-50/80 dark:from-gray-800/95 dark:to-purple-900/30 rounded-3xl shadow-2xl border-2 border-purple-200/50 dark:border-purple-800/50 p-8 max-w-md mx-4 animate-scaleIn">
        {/* 装饰背景 */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full text-purple-600">
            <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="3"/>
            <circle cx="50" cy="50" r="15" fill="currentColor"/>
          </svg>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-800/50 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-300 transition-all duration-300 hover:rotate-90"
        >
          ✕
        </button>

        {/* 图标 */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl shadow-xl"></div>
          <div className="absolute inset-2 bg-gradient-to-br from-pink-400 to-pink-500 rounded-xl flex items-center justify-center">
            <span className="text-purple-800 text-3xl font-black">{icon}</span>
          </div>
        </div>

        {/* 标题和描述 */}
        <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-300 text-center mb-3">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
          {description}
        </p>

        {/* 按钮组 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
          >
            取消
          </button>
          <button
            onClick={handleLogin}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            去登录
          </button>
        </div>
      </div>
    </div>
  )
}
