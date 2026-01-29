'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

interface ErrorInfo {
  code: string;
  title: string;
  message: string;
  description: string;
  icon: string;
  color: string;
  suggestions: string[];
}

const errorTypes: Record<string, ErrorInfo> = {
  '404': {
    code: '404',
    title: '页面未找到',
    message: '抱歉，您访问的页面不存在',
    description: '页面可能已被删除、移动或您输入的网址有误',
    icon: '🔍',
    color: 'from-blue-600 to-cyan-600',
    suggestions: [
      '检查网址是否正确',
      '返回首页重新导航',
      '使用搜索功能查找内容',
      '联系客服获取帮助',
    ],
  },
  '403': {
    code: '403',
    title: '访问被拒绝',
    message: '抱歉，您没有权限访问此页面',
    description: '此页面需要特定的权限或登录状态',
    icon: '🚫',
    color: 'from-red-600 to-pink-600',
    suggestions: [
      '请先登录您的账户',
      '检查是否有访问权限',
      '联系管理员申请权限',
      '返回首页浏览其他内容',
    ],
  },
  '500': {
    code: '500',
    title: '服务器错误',
    message: '抱歉，服务器出现了问题',
    description: '我们正在努力修复这个问题，请稍后再试',
    icon: '⚙️',
    color: 'from-orange-600 to-red-600',
    suggestions: [
      '刷新页面重试',
      '稍后再试',
      '清除浏览器缓存',
      '联系技术支持',
    ],
  },
  '503': {
    code: '503',
    title: '服务暂时不可用',
    message: '抱歉，服务正在维护中',
    description: '我们正在进行系统维护，请稍后再试',
    icon: '🔧',
    color: 'from-yellow-600 to-orange-600',
    suggestions: [
      '稍后再试',
      '关注官方公告',
      '使用备用服务',
      '联系客服了解详情',
    ],
  },
  'network': {
    code: 'NETWORK',
    title: '网络连接错误',
    message: '抱歉，网络连接出现问题',
    description: '请检查您的网络连接并重试',
    icon: '📡',
    color: 'from-purple-600 to-indigo-600',
    suggestions: [
      '检查网络连接',
      '尝试刷新页面',
      '检查防火墙设置',
      '联系网络管理员',
    ],
  },
}

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const [errorInfo, setErrorInfo] = useState<ErrorInfo>(errorTypes['404'])
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const errorCode = searchParams.get('code') || '404'
    const errorType = errorTypes[errorCode] || errorTypes['404']
    setErrorInfo(errorType)

    // 自动倒计时返回首页
    if (errorCode === '404' || errorCode === '403') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            window.location.href = '/'
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [searchParams])

  const handleRetry = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        {/* 错误信息卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* 错误头部 */}
          <div className={`bg-gradient-to-r ${errorInfo.color} text-white p-8 text-center relative overflow-hidden`}>
            {/* 背景装饰 */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-black/10" />
            <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="text-6xl mb-4">{errorInfo.icon}</div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-2">
                {errorInfo.code}
              </h1>
              <h2 className="text-2xl lg:text-3xl font-semibold mb-2">
                {errorInfo.title}
              </h2>
              <p className="text-lg text-white/90 max-w-md mx-auto">
                {errorInfo.message}
              </p>
            </div>
          </div>

          {/* 错误详情 */}
          <div className="p-8">
            <div className="text-center mb-8">
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                {errorInfo.description}
              </p>
            </div>

            {/* 建议操作 */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                您可以尝试以下操作：
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {errorInfo.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                        {index + 1}
                      </span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                      {suggestion}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleRetry}
                className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                重试
              </button>

              <Link
                href="/"
                className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 font-medium text-center"
              >
                返回首页
              </Link>

              <Link
                href="/support"
                className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 font-medium text-center"
              >
                联系支持
              </Link>
            </div>

            {/* 自动跳转提示 */}
            {(errorInfo.code === '404' || errorInfo.code === '403') && countdown > 0 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {countdown} 秒后自动返回首页
                </p>
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <div
                    className="bg-blue-600 h-1 rounded-full transition-all duration-1000"
                    style={{ width: `${(10 - countdown) * 10}%` }}
                   />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 快速导航 */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/couplet"
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-center"
          >
            <div className="text-2xl mb-2">📅</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">时间线</div>
          </Link>

          <Link
            href="/search"
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-center"
          >
            <div className="text-2xl mb-2">🔍</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">搜索</div>
          </Link>

          <Link
            href="/ai-assistant"
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-center"
          >
            <div className="text-2xl mb-2">🤖</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">AI助手</div>
          </Link>

          <Link
            href="/about"
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-center"
          >
            <div className="text-2xl mb-2">ℹ️</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">关于我们</div>
          </Link>
        </div>

        {/* 错误报告 */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                报告问题
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                如果您认为这是一个错误，请
                <Link href="/feedback" className="underline hover:text-blue-800 dark:hover:text-blue-100">
                  向我们报告
                </Link>
                ，我们会尽快处理。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
