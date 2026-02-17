'use client'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

export default function ClientFeedbackPage() {
  const t = useTranslations('main.feedback')
  const tCommon = useTranslations('main.common')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: '',
    title: '',
    description: '',
    priority: 'medium',
  })
  const [status, setStatus] = useState({ loading: false, error: '', success: '' })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus({ loading: true, error: '', success: '' })
    try {
      const response = await fetch('/api/admin/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const result = await response.json()
      if (result.success) {
        setStatus({ loading: false, error: '', success: t('form.success') })
        setFormData({
          name: '',
          email: '',
          type: '',
          title: '',
          description: '',
          priority: 'medium',
        })
      } else {
        setStatus({ loading: false, error: result.message || t('form.error'), success: '' })
      }
    } catch (error) {
      setStatus({ loading: false, error: t('form.networkError'), success: '' })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

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
              <span className="text-2xl font-black">馈</span>
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

        {/* 主要内容 */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 反馈类型说明 */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gradient-to-br from-white/95 to-purple-50/80 dark:from-gray-800/95 dark:to-purple-900/30 rounded-3xl p-6 shadow-xl border-2 border-purple-100/50 dark:border-purple-800/50 backdrop-blur-sm">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl flex items-center justify-center mr-3 shadow-lg transform rotate-3">
                    <span className="text-lg">📝</span>
                  </div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{t('types.title')}</h3>
                </div>

                <div className="space-y-4">
                  <div className="group flex items-start space-x-3 p-3 rounded-2xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 transform hover:scale-105">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-lg">💡</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">{t('types.feature.title')}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t('types.feature.description')}</p>
                    </div>
                  </div>

                  <div className="group flex items-start space-x-3 p-3 rounded-2xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-blue-50 dark:hover:from-pink-900/20 dark:hover:to-blue-900/20 transition-all duration-300 transform hover:scale-105">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/40 dark:to-pink-800/40 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-lg">🐛</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors duration-300">{t('types.bug.title')}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t('types.bug.description')}</p>
                    </div>
                  </div>

                  <div className="group flex items-start space-x-3 p-3 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 transform hover:scale-105">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-lg">🎨</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{t('types.ui.title')}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t('types.ui.description')}</p>
                    </div>
                  </div>

                  <div className="group flex items-start space-x-3 p-3 rounded-2xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 transform hover:scale-105">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-900/40 dark:to-pink-800/40 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-lg">📚</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">{t('types.content.title')}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t('types.content.description')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white/95 to-pink-50/80 dark:from-gray-800/95 dark:to-pink-900/30 rounded-3xl p-6 shadow-xl border-2 border-pink-100/50 dark:border-pink-800/50 backdrop-blur-sm">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-600 to-purple-600 text-white rounded-2xl flex items-center justify-center mr-3 shadow-lg transform rotate-3">
                    <span className="text-lg">🎁</span>
                  </div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{t('benefits.title')}</h3>
                </div>

                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  {t.raw('benefits.items').map((item: string, index: number) => (
                    <li key={index} className="flex items-start space-x-3 p-2 rounded-xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 dark:hover:from-pink-900/20 dark:hover:to-purple-900/20 transition-all duration-300">
                      <span className="text-green-500 font-bold text-lg">✓</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 联系信息 */}
              <div className="relative overflow-hidden">
                <div className="relative bg-gradient-to-br from-white/90 to-blue-50/80 dark:from-gray-800/90 dark:to-blue-900/30 backdrop-blur-sm rounded-3xl p-6 border-2 border-blue-200/50 dark:border-blue-800/50 shadow-xl">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl flex items-center justify-center mr-3 shadow-lg transform rotate-3">
                      <span className="text-lg">📞</span>
                    </div>
                    <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t('contact.title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {t('contact.description')}
                  </p>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <p className="flex items-center">
                      <span className="text-blue-500 mr-2">📧</span>
                      {t('contact.email')}
                    </p>
                  </div>
                  <Link
                    href="/contact"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <span className="mr-2">✉️</span>
                    {t('contact.viewMore')}
                  </Link>
                </div>
              </div>
            </div>

            {/* 反馈表单 */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-white/95 to-blue-50/80 dark:from-gray-800/95 dark:to-blue-900/30 rounded-3xl p-8 shadow-xl border-2 border-blue-100/50 dark:border-blue-800/50 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-bold text-purple-700 dark:text-purple-300 mb-2">
                        {t('form.name.label')}
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-purple-200 dark:border-purple-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-400/30 dark:focus:ring-purple-600/30 focus:border-purple-400 dark:focus:border-purple-600 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white transition-all duration-300 shadow-lg"
                        placeholder={t('form.name.placeholder')}
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-bold text-purple-700 dark:text-purple-300 mb-2">
                        {t('form.email.label')}
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-purple-200 dark:border-purple-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-400/30 dark:focus:ring-purple-600/30 focus:border-purple-400 dark:focus:border-purple-600 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white transition-all duration-300 shadow-lg"
                        placeholder={t('form.email.placeholder')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="type" className="block text-sm font-bold text-purple-700 dark:text-purple-300 mb-2">
                        {t('form.type.label')}
                      </label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-purple-200 dark:border-purple-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-400/30 dark:focus:ring-purple-600/30 focus:border-purple-400 dark:focus:border-purple-600 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white transition-all duration-300 shadow-lg"
                      >
                        <option value="">{t('form.type.placeholder')}</option>
                        <option value="feature">{t('form.type.options.feature')}</option>
                        <option value="bug">{t('form.type.options.bug')}</option>
                        <option value="ui">{t('form.type.options.ui')}</option>
                        <option value="content">{t('form.type.options.content')}</option>
                        <option value="other">{t('form.type.options.other')}</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="priority" className="block text-sm font-bold text-purple-700 dark:text-purple-300 mb-2">
                        {t('form.priority.label')}
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-purple-200 dark:border-purple-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-400/30 dark:focus:ring-purple-600/30 focus:border-purple-400 dark:focus:border-purple-600 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white transition-all duration-300 shadow-lg"
                      >
                        <option value="low">{t('form.priority.options.low')}</option>
                        <option value="medium">{t('form.priority.options.medium')}</option>
                        <option value="high">{t('form.priority.options.high')}</option>
                        <option value="urgent">{t('form.priority.options.urgent')}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="title" className="block text-sm font-bold text-purple-700 dark:text-purple-300 mb-2">
                      {t('form.title.label')}
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-purple-200 dark:border-purple-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-400/30 dark:focus:ring-purple-600/30 focus:border-purple-400 dark:focus:border-purple-600 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white transition-all duration-300 shadow-lg"
                      placeholder={t('form.title.placeholder')}
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-bold text-purple-700 dark:text-purple-300 mb-2">
                      {t('form.description.label')}
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-purple-200 dark:border-purple-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-400/30 dark:focus:ring-purple-600/30 focus:border-purple-400 dark:focus:border-purple-600 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white transition-all duration-300 shadow-lg resize-none"
                      placeholder={t('form.description.placeholder')}
                    />
                  </div>

                  {/* 状态消息 */}
                  {status.error && (
                    <div className="p-4 bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-800/40 border-2 border-red-200 dark:border-red-800 rounded-2xl">
                      <div className="flex items-center">
                        <span className="text-red-600 dark:text-red-400 text-lg mr-2">⚠️</span>
                        <p className="text-sm text-red-700 dark:text-red-300 font-medium">{status.error}</p>
                      </div>
                    </div>
                  )}
                  
                  {status.success && (
                    <div className="p-4 bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/40 border-2 border-green-200 dark:border-green-800 rounded-2xl">
                      <div className="flex items-center">
                        <span className="text-green-600 dark:text-green-400 text-lg mr-2">✅</span>
                        <p className="text-sm text-green-700 dark:text-green-300 font-medium">{status.success}</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={status.loading}
                      className="relative w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer flex items-center justify-center gap-2 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      {status.loading ? (
                        <>
                          <div className="relative w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span className="relative">{t('form.submitting')}</span>
                        </>
                      ) : (
                        <>
                          <span className="relative text-lg">💌</span>
                          <span className="relative">{t('form.submit')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
