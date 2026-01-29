'use client'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

export default function NotFound() {
  const t = useTranslations('main.notFound')
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
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
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-black/10" />
            <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="text-6xl mb-4">🔍</div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-2">404</h1>
              <h2 className="text-2xl lg:text-3xl font-semibold mb-2">{t('title')}</h2>
              <p className="text-lg text-white/90 max-w-md mx-auto">{t('description')}</p>
            </div>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                {t('details')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={() => window.history.back()}
                className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                {t('back')}
              </button>

              <Link
                href="/"
                className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 font-medium text-center"
              >
                {t('home')}
              </Link>

              <Link
                href="/studio"
                className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 font-medium text-center"
              >
                {t('create')}
              </Link>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('autoRedirect', { count: countdown })}
              </p>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div
                  className="bg-blue-600 h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${(10 - countdown) * 10}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
