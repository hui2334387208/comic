'use client'
import Link from 'next/link'
import React from 'react'
import { useTranslations } from 'next-intl'

export default function ClientAboutPage() {
  const t = useTranslations('main.about')
  const tCommon = useTranslations('main.common')
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-orange-900/20">
      {/* 传统文化背景装饰 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* 传统云纹装饰 */}
        <div className="absolute top-10 left-10 w-40 h-40 opacity-5 dark:opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
            <path d="M20 50 Q30 30, 50 40 Q70 30, 80 50 Q70 70, 50 60 Q30 70, 20 50 Z" 
                  fill="currentColor" opacity="0.6"/>
            <circle cx="50" cy="50" r="8" fill="currentColor" opacity="0.8"/>
          </svg>
        </div>
        
        {/* 传统回纹装饰 */}
        <div className="absolute top-32 right-20 w-32 h-32 opacity-5 dark:opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-orange-600">
            <path d="M20 20 L80 20 L80 40 L40 40 L40 60 L80 60 L80 80 L20 80 L20 60 L60 60 L60 40 L20 40 Z" 
                  fill="none" stroke="currentColor" strokeWidth="3"/>
          </svg>
        </div>
        
        {/* 传统如意纹装饰 */}
        <div className="absolute bottom-20 left-20 w-36 h-36 opacity-5 dark:opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-yellow-600">
            <path d="M50 10 Q70 20, 80 40 Q90 60, 70 80 Q50 90, 30 80 Q10 60, 20 40 Q30 20, 50 10 Z" 
                  fill="currentColor" opacity="0.4"/>
            <path d="M50 25 Q60 30, 65 45 Q70 60, 60 70 Q50 75, 40 70 Q30 60, 35 45 Q40 30, 50 25 Z" 
                  fill="currentColor" opacity="0.6"/>
          </svg>
        </div>
        
        {/* 传统祥云装饰 */}
        <div className="absolute bottom-32 right-32 w-28 h-28 opacity-5 dark:opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-red-700">
            <path d="M25 60 Q15 50, 25 40 Q35 30, 50 35 Q65 30, 75 40 Q85 50, 75 60 Q65 70, 50 65 Q35 70, 25 60 Z" 
                  fill="currentColor"/>
          </svg>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* 面包屑导航 - 中国风样式 */}
        <nav className="flex items-center space-x-2 text-sm mb-6">
          <Link href="/" className="flex items-center text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200 font-medium">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {tCommon('home')}
          </Link>
          <span className="text-red-400 dark:text-red-500">·</span>
          <span className="text-gray-900 dark:text-white font-medium">{t('title')}</span>
        </nav>

        {/* 页面标题 - 传统风格 */}
        <div className="text-center mb-16">
          {/* 传统印章风格标识 */}
          <div className="inline-flex items-center justify-center w-20 h-20 mb-8 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
            <div className="text-center">
              <span className="text-2xl font-black">关</span>
              <div className="w-4 h-0.5 bg-yellow-400 mx-auto mt-1"></div>
            </div>
          </div>

          <h1 className="text-4xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-wide">
            <span className="block bg-gradient-to-r from-red-600 via-orange-600 to-red-700 bg-clip-text text-transparent mb-2 drop-shadow-sm">
              {t('title')}
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-12">
          {/* 使命愿景 - 传统卡片样式 */}
          <div className="bg-gradient-to-br from-white/95 to-red-50/80 dark:from-gray-800/95 dark:to-red-900/30 rounded-3xl p-8 shadow-xl border-2 border-red-100/50 dark:border-red-800/50 backdrop-blur-sm">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl flex items-center justify-center mr-4 shadow-lg transform rotate-3">
                <span className="text-xl font-black">使</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">{t('mission.title')}</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
              {t('mission.content')}
            </p>
          </div>

          <div className="bg-gradient-to-br from-white/95 to-orange-50/80 dark:from-gray-800/95 dark:to-orange-900/30 rounded-3xl p-8 shadow-xl border-2 border-orange-100/50 dark:border-orange-800/50 backdrop-blur-sm">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 text-white rounded-2xl flex items-center justify-center mr-4 shadow-lg transform rotate-3">
                <span className="text-xl font-black">愿</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{t('vision.title')}</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
              {t('vision.content')}
            </p>
          </div>

          {/* 功能特色 - 传统网格布局 */}
          <div className="bg-gradient-to-br from-white/95 to-yellow-50/80 dark:from-gray-800/95 dark:to-yellow-900/30 rounded-3xl p-8 shadow-xl border-2 border-yellow-100/50 dark:border-yellow-800/50 backdrop-blur-sm">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-orange-600 text-white rounded-2xl flex items-center justify-center mr-4 shadow-lg transform rotate-3">
                <span className="text-xl font-black">特</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{t('features.title')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="group flex items-start space-x-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-red-900/20 dark:hover:to-orange-900/20 transition-all duration-300 transform hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">{t('features.aiGeneration.title')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t('features.aiGeneration.description')}</p>
                  </div>
                </div>
                <div className="group flex items-start space-x-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 dark:hover:from-orange-900/20 dark:hover:to-yellow-900/20 transition-all duration-300 transform hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">📚</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">{t('features.cultureLibrary.title')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t('features.cultureLibrary.description')}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="group flex items-start space-x-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-yellow-50 hover:to-red-50 dark:hover:from-yellow-900/20 dark:hover:to-red-900/20 transition-all duration-300 transform hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🎨</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-300">{t('features.visualization.title')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t('features.visualization.description')}</p>
                  </div>
                </div>
                <div className="group flex items-start space-x-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-red-900/20 dark:hover:to-orange-900/20 transition-all duration-300 transform hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-orange-200 dark:from-red-900/40 dark:to-orange-800/40 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">✨</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">{t('features.diverseTopics.title')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t('features.diverseTopics.description')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 联系我们 - 传统CTA样式 */}
          <div className="relative overflow-hidden">
            {/* 传统纹样背景 */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/8 via-orange-500/6 to-yellow-500/8 rounded-3xl" />
            <div className="absolute top-0 left-0 w-32 h-32 opacity-8">
              <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
                <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2"/>
                <path d="M30 50 Q50 30, 70 50 Q50 70, 30 50" fill="currentColor" opacity="0.3"/>
              </svg>
            </div>
            <div className="absolute bottom-0 right-0 w-24 h-24 opacity-8">
              <svg viewBox="0 0 100 100" className="w-full h-full text-orange-600">
                <path d="M20 20 L80 20 L80 40 L40 40 L40 60 L80 60 L80 80 L20 80 L20 60 L60 60 L60 40 L20 40 Z" 
                      fill="none" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            
            <div className="relative bg-gradient-to-br from-white/90 to-red-50/80 dark:from-gray-800/90 dark:to-red-900/30 backdrop-blur-sm rounded-3xl p-12 border-2 border-red-200/50 dark:border-red-800/50 shadow-2xl text-center">
              {/* 传统装饰边框 */}
              <div className="absolute -top-3 -left-3 w-12 h-12 border-t-4 border-l-4 border-red-600 rounded-tl-2xl"></div>
              <div className="absolute -top-3 -right-3 w-12 h-12 border-t-4 border-r-4 border-red-600 rounded-tr-2xl"></div>
              <div className="absolute -bottom-3 -left-3 w-12 h-12 border-b-4 border-l-4 border-red-600 rounded-bl-2xl"></div>
              <div className="absolute -bottom-3 -right-3 w-12 h-12 border-b-4 border-r-4 border-red-600 rounded-br-2xl"></div>
              
              <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-3xl mb-6 shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <span className="text-2xl font-black">联</span>
              </div>
              
              <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4">
                {t('contact.title')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                {t('contact.description')}
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/contact"
                  className="relative px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl font-bold hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer flex items-center gap-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative text-lg">📞</span>
                  <span className="relative">{t('contact.contactUs')}</span>
                </Link>
                <Link
                  href="/feedback"
                  className="relative px-8 py-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 text-red-700 dark:text-red-300 rounded-2xl font-bold border-2 border-red-200 dark:border-red-800 hover:from-red-100 hover:to-orange-100 dark:hover:from-red-800/40 dark:hover:to-orange-800/40 transition-all duration-300 transform hover:scale-105 cursor-pointer flex items-center gap-2"
                >
                  <span className="text-lg">💬</span>
                  <span>{t('contact.feedback')}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
