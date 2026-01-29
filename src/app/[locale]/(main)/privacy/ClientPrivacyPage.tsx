'use client'
import Link from 'next/link'
import React from 'react'
import { useTranslations } from 'next-intl'

export default function ClientPrivacyPage() {
  const t = useTranslations('main.privacy')
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-orange-900/20 relative overflow-hidden">
      {/* Traditional decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-red-600 rounded-full"></div>
        <div className="absolute top-20 right-20 w-24 h-24 border-2 border-orange-500 rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 border-2 border-yellow-600 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-20 h-20 border-2 border-red-500 rounded-full"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link href="/" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">{t('breadcrumb.home')}</Link>
          <span>/</span>
          <span className="text-red-800 dark:text-red-300 font-medium">{t('breadcrumb.privacy')}</span>
        </nav>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-full mb-6 shadow-lg">
            <span className="text-2xl font-bold text-white">隐</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent mb-6">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border-2 border-red-200 dark:border-red-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-yellow-500/20 to-red-500/20 rounded-tr-full"></div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4">{t('sections.collection.title')}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t('sections.collection.description')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              {t.raw('sections.collection.items').map((item: string, index: number) => (
                <li key={index} className="hover:text-red-600 dark:hover:text-red-400 transition-colors">{item}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border-2 border-orange-200 dark:border-orange-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-red-500/20 to-orange-500/20 rounded-tr-full"></div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent mb-4">{t('sections.usage.title')}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t('sections.usage.description')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              {t.raw('sections.usage.items').map((item: string, index: number) => (
                <li key={index} className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">{item}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border-2 border-yellow-200 dark:border-yellow-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-red-500/20 rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-orange-500/20 to-yellow-500/20 rounded-tr-full"></div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-red-600 bg-clip-text text-transparent mb-4">{t('sections.security.title')}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t('sections.security.description')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              {t.raw('sections.security.items').map((item: string, index: number) => (
                <li key={index} className="hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors">{item}</li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-r from-red-600/10 via-orange-600/10 to-yellow-600/10 rounded-2xl p-8 border-2 border-red-300 dark:border-red-700 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-yellow-500/5"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">联</span>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">{t('sections.contact.title')}</h2>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {t('sections.contact.description')}
              </p>
              <div className="space-y-2 text-gray-600 dark:text-gray-400">
                <p>{t('sections.contact.email')}</p>
              </div>
              <div className="mt-6">
                <Link
                  href="/contact"
                  className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  {t('sections.contact.button')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
