'use client'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

export default function ClientAboutPage() {
  const t = useTranslations('main.about')
  const tCommon = useTranslations('main.common')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* 动态背景装饰 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* 漫画风格装饰 */}
        <div className="absolute top-10 left-10 w-40 h-40 opacity-5 dark:opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-purple-600">
            <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="3"/>
            <circle cx="50" cy="50" r="15" fill="currentColor"/>
          </svg>
        </div>
        
        <div className="absolute top-32 right-20 w-32 h-32 opacity-5 dark:opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-pink-600">
            <path d="M30 30 L70 30 L70 70 L30 70 Z" fill="none" stroke="currentColor" strokeWidth="3"/>
            <path d="M40 40 L60 40 L60 60 L40 60 Z" fill="currentColor" opacity="0.5"/>
          </svg>
        </div>
        
        {/* 动态鼠标跟随效果 */}
        <div
          className="absolute w-96 h-96 rounded-full pointer-events-none transition-all duration-500"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, rgba(219, 39, 119, 0.05) 40%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 面包屑导航 */}
        <nav className="flex items-center space-x-2 text-sm mb-6">
          <Link href="/" className="flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200 font-medium">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {tCommon('home')}
          </Link>
          <span className="text-purple-400 dark:text-purple-500">·</span>
          <span className="text-gray-900 dark:text-white font-medium">{t('title')}</span>
        </nav>

        {/* 页面标题 */}
        <div className="text-center mb-16 pt-12">
          {/* 漫画风格标识 */}
          <div className="inline-flex items-center justify-center w-24 h-24 mb-8 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
            <div className="text-center">
              <span className="text-2xl font-black">关</span>
              <div className="w-4 h-0.5 bg-yellow-400 mx-auto mt-1"></div>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-6 tracking-wide">
            <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2 drop-shadow-sm">
              {t('title')}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-12">
          {/* 使命愿景 */}
          <div className="bg-gradient-to-br from-white/95 to-purple-50/80 dark:from-gray-800/95 dark:to-purple-900/30 rounded-3xl p-8 shadow-xl border-2 border-purple-100/50 dark:border-purple-800/50 backdrop-blur-sm">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl flex items-center justify-center mr-4 shadow-lg transform rotate-3">
                <span className="text-xl">🎯</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{t('mission.title')}</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
              {t('mission.content')}
            </p>
          </div>

          <div className="bg-gradient-to-br from-white/95 to-pink-50/80 dark:from-gray-800/95 dark:to-pink-900/30 rounded-3xl p-8 shadow-xl border-2 border-pink-100/50 dark:border-pink-800/50 backdrop-blur-sm">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-purple-600 text-white rounded-2xl flex items-center justify-center mr-4 shadow-lg transform rotate-3">
                <span className="text-xl">🌟</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{t('vision.title')}</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
              {t('vision.content')}
            </p>
          </div>

          {/* 功能特色 */}
          <div className="bg-gradient-to-br from-white/95 to-blue-50/80 dark:from-gray-800/95 dark:to-blue-900/30 rounded-3xl p-8 shadow-xl border-2 border-blue-100/50 dark:border-blue-800/50 backdrop-blur-sm">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl flex items-center justify-center mr-4 shadow-lg transform rotate-3">
                <span className="text-xl">✨</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t('features.title')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="group flex items-start space-x-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 transform hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">{t('features.aiGeneration.title')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t('features.aiGeneration.description')}</p>
                  </div>
                </div>
                <div className="group flex items-start space-x-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-blue-50 dark:hover:from-pink-900/20 dark:hover:to-blue-900/20 transition-all duration-300 transform hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/40 dark:to-pink-800/40 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🎨</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors duration-300">{t('features.multipleStyles.title')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t('features.multipleStyles.description')}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="group flex items-start space-x-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 transform hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{t('features.fastCreation.title')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t('features.fastCreation.description')}</p>
                  </div>
                </div>
                <div className="group flex items-start space-x-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 transform hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-900/40 dark:to-pink-800/40 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🌐</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">{t('features.communitySharing.title')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t('features.communitySharing.description')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 联系我们 */}
          <div className="relative overflow-hidden">
            <div className="relative bg-gradient-to-br from-white/90 to-purple-50/80 dark:from-gray-800/90 dark:to-purple-900/30 backdrop-blur-sm rounded-3xl p-12 border-2 border-purple-200/50 dark:border-purple-800/50 shadow-2xl text-center">
              
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-3xl mb-8 shadow-xl">
                <span className="text-3xl font-black">🎨</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
                {t('cta.title')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                {t('cta.description')}
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/"
                  className="relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer flex items-center gap-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative text-lg">🚀</span>
                  <span className="relative">{t('cta.startCreating')}</span>
                </Link>
                <Link
                  href="/contact"
                  className="relative px-8 py-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-700 dark:text-purple-300 rounded-2xl font-bold border-2 border-purple-200 dark:border-purple-800 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/40 dark:hover:to-pink-800/40 transition-all duration-300 transform hover:scale-105 cursor-pointer flex items-center gap-2"
                >
                  <span className="text-lg">📞</span>
                  <span>{t('cta.contactUs')}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
