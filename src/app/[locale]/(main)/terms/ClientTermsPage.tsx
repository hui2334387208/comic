'use client'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

export default function ClientTermsPage() {
  const t = useTranslations('main.terms')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 relative overflow-hidden">
      {/* 动态背景装饰 - 漫画风格 */}
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
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* 面包屑导航 */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link href="/" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">{t('breadcrumb.home')}</Link>
          <span>/</span>
          <span className="text-purple-800 dark:text-purple-300 font-medium">{t('breadcrumb.terms')}</span>
        </nav>

        {/* 页面标题 - 漫画风格 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 mb-6">
            <div className="text-center">
              <span className="text-2xl font-black">📜</span>
              <div className="w-4 h-0.5 bg-yellow-400 mx-auto mt-1"></div>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-6 tracking-wide">
            <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2 drop-shadow-sm">
              {t('title')}
            </span>
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* 主要内容 - 漫画风格卡片 */}
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-purple-100 dark:border-purple-900/30 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-tr-full"></div>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <span className="text-white text-xl">🎨</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{t('sections.service.title')}</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t('sections.service.description')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              {t.raw('sections.service.items').map((item: string, index: number) => (
                <li key={index} className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">{item}</li>
              ))}
            </ul>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          </div>

          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-pink-100 dark:border-pink-900/30 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-500/10 to-blue-500/10 rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-tr-full"></div>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <span className="text-white text-xl">👤</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">{t('sections.responsibility.title')}</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t('sections.responsibility.description')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              {t.raw('sections.responsibility.items').map((item: string, index: number) => (
                <li key={index} className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">{item}</li>
              ))}
            </ul>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          </div>

          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-blue-100 dark:border-blue-900/30 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-pink-500/10 to-blue-500/10 rounded-tr-full"></div>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <span className="text-white text-xl">📝</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t('sections.content.title')}</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t('sections.content.description')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              {t.raw('sections.content.items').map((item: string, index: number) => (
                <li key={index} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{item}</li>
              ))}
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-l-4 border-blue-600">
              {t('sections.content.note')}
            </p>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          </div>

          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-purple-100 dark:border-purple-900/30 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-tr-full"></div>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <span className="text-white text-xl">©️</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{t('sections.intellectual.title')}</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t('sections.intellectual.description')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              {t.raw('sections.intellectual.items').map((item: string, index: number) => (
                <li key={index} className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">{item}</li>
              ))}
            </ul>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          </div>

          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-pink-100 dark:border-pink-900/30 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-500/10 to-blue-500/10 rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-tr-full"></div>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <span className="text-white text-xl">⚡</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">{t('sections.availability.title')}</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t('sections.availability.description')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              {t.raw('sections.availability.items').map((item: string, index: number) => (
                <li key={index} className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">{item}</li>
              ))}
            </ul>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          </div>

          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-blue-100 dark:border-blue-900/30 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-pink-500/10 to-blue-500/10 rounded-tr-full"></div>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <span className="text-white text-xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t('sections.disclaimer.title')}</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t('sections.disclaimer.description')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              {t.raw('sections.disclaimer.items').map((item: string, index: number) => (
                <li key={index} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{item}</li>
              ))}
            </ul>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          </div>

          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-purple-100 dark:border-purple-900/30 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-tr-full"></div>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <span className="text-white text-xl">🔄</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{t('sections.modification.title')}</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('sections.modification.description')}
            </p>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          </div>

          <div className="bg-gradient-to-br from-white/90 to-purple-50/80 dark:from-gray-800/90 dark:to-purple-900/30 backdrop-blur-sm rounded-2xl p-8 border-2 border-purple-200 dark:border-purple-700 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl">
                  <span className="text-white text-2xl">📧</span>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{t('sections.contact.title')}</h2>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                {t('sections.contact.description')}
              </p>
              <div className="space-y-2 text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-700/60 rounded-xl p-4 mb-6">
                <p className="flex items-center gap-2">
                  <span className="text-lg">✉️</span>
                  <span>{t('sections.contact.email')}</span>
                </p>
              </div>
              <div className="mt-6">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
                >
                  <span className="text-xl">💬</span>
                  <span>{t('sections.contact.button')}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
