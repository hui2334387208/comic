'use client'

import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
// import AdsterraAd from '@/components/AdsterraAd'
// import MontagAd from '@/components/MontagAd'
// import MontagAd2 from '@/components/MontagAd2'

function CoupletSection({ title, desc, couplets = [] }: { title: string; desc: string; couplets?: any[] }) {
  const t = useTranslations('main.home.coupletCard')
  const router = useRouter()

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 mt-0">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">{title}</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">{desc}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {couplets.map((item, index) => {
          // 直接使用真实数据，如果没有内容就显示占位符
          const firstContent = item.contents?.[0]
          const topLine = firstContent?.upperLine || t('noTopLine')
          const bottomLine = firstContent?.lowerLine || t('noBottomLine')
          const horizontal = firstContent?.horizontalScroll || t('noHorizontal')
          
          return (
            <div
              key={item.id}
              className="group relative bg-gradient-to-br from-white/95 to-red-50/80 dark:from-gray-800/95 dark:to-red-900/30 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 p-6 border-2 border-red-100/50 dark:border-red-800/50 hover:border-red-300 dark:hover:border-red-600 overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* 传统装饰背景 */}
              <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
                <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
                  <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="3"/>
                  <path d="M35 50 Q50 35, 65 50 Q50 65, 35 50" fill="currentColor"/>
                </svg>
              </div>
              
              {/* 分类标签和印章 */}
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/40 dark:to-orange-900/40 text-red-700 dark:text-red-300 text-xs font-bold border border-red-200 dark:border-red-800">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                  {item?.category?.name || t('defaultCategory')}
                </div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl flex items-center justify-center text-sm font-black shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
                  <span>联</span>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
                </div>
              </div>

              {/* 标题 */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300 tracking-wide">
                {item.title}
              </h3>

              {/* 对联展示区 - 增强传统风格 */}
              <div className="relative mb-6">
                <div className="p-6 relative">
                  
                  {/* 横批 - 增强设计 */}
                  <div className="text-center mb-6">
                    <div className="inline-block relative">
                      <div className="bg-gradient-to-r from-red-600 to-red-700 border-2 border-yellow-400 rounded-2xl px-8 py-4 shadow-lg">
                        <span className="text-yellow-300 font-black text-base tracking-wider">
                          {horizontal}
                        </span>
                      </div>
                      {/* 传统印章装饰 */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-red-600">
                        <span className="text-red-800 text-xs font-bold">印</span>
                      </div>
                    </div>
                  </div>

                  {/* 对联主体 - 增强视觉效果 */}
                  <div className="flex justify-between items-start gap-6">
                    {/* 上联 */}
                    <div className="flex-1 relative">
                      <div className="bg-gradient-to-b from-red-600 to-red-700 border-2 border-yellow-400 rounded-2xl p-4 min-h-[180px] flex flex-col justify-center items-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-800 text-xs px-3 py-1 rounded-full font-black shadow-md">
                          {t('topLine')}
                        </div>
                        <div className="flex flex-col items-center">
                          {topLine.split('').map((char: string, i: number) => (
                            <span 
                              key={i} 
                              className="text-yellow-300 font-black text-lg mb-1 block hover:text-yellow-200 transition-colors duration-200"
                              style={{ animationDelay: `${i * 100}ms` }}
                            >
                              {char}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 下联 */}
                    <div className="flex-1 relative">
                      <div className="bg-gradient-to-b from-red-600 to-red-700 border-2 border-yellow-400 rounded-2xl p-4 min-h-[180px] flex flex-col justify-center items-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-800 text-xs px-3 py-1 rounded-full font-black shadow-md">
                          {t('bottomLine')}
                        </div>
                        <div className="flex flex-col items-center">
                          {bottomLine.split('').map((char: string, i: number) => (
                            <span 
                              key={i} 
                              className="text-yellow-300 font-black text-lg mb-1 block hover:text-yellow-200 transition-colors duration-200"
                              style={{ animationDelay: `${i * 100 + 500}ms` }}
                            >
                              {char}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 操作按钮和热度 - 增强设计 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
                  <span className="text-xs font-medium">{t('hotLevel')}</span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-5 rounded-full transition-all duration-300 ${i < Math.min(5, Math.round((item.hot ?? 0) / 10)) ? 'bg-gradient-to-t from-red-600 to-red-400 shadow-sm' : 'bg-gray-200 dark:bg-gray-600'}`}
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    // 打开广告页面到新窗口
                    // window.open('https://otieu.com/4/10006059', '_blank', 'noopener,noreferrer')
                    // 跳转到对联详情页
                    router.push(`/couplet/${item?.category?.slug}/${encodeURIComponent(item.title)}/${item.id}`)
                  }}
                  className="relative px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl text-sm font-bold hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer flex items-center gap-2 overflow-hidden"
                >
                  {/* 按钮装饰效果 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative text-lg">🎋</span>
                  <span className="relative">{t('viewButton')}</span>
                </button>
              </div>

              {/* 悬停光效 - 增强效果 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-100/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-3xl pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />
            </div>
          )
        })}
        {couplets.length === 0 && (
          <div className="col-span-3 text-center text-gray-400 py-12">
            <div className="text-6xl mb-4">🎋</div>
            <div className="text-lg">{t('noData')}</div>
            <div className="text-sm text-gray-500 mt-2">{t('noDataMessage')}</div>
          </div>
        )}
      </div>
    </section>
  )
}

export default function ClientHomePage({ hotCouplets = [], latestCouplets = [], featuredCouplets = [] }: {
  hotCouplets?: any[], latestCouplets?: any[], featuredCouplets?: any[]
}) {
  // 保持数据结构兼容
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const router = useRouter()
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const t = useTranslations('main.home')
  const locale = useLocale()

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // AI生成对联
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      setError(t('hero.enterPrompt'))
      return
    }

    // 打开广告页面到新窗口
    // window.open('https://otieu.com/4/10006059', '_blank', 'noopener,noreferrer')

    setIsGenerating(true)
    setError('')
    try {
      // 1) 限额检查
      const limitRes = await fetch('/api/couplet/generate/check-limit', { method: 'POST' })
      const limitData = await limitRes.json()

      if (limitRes.status === 429 && !limitData?.data?.allowed) {
        throw new Error(t('hero.limitExceeded'))
      }
      if (!limitRes.ok) {
        throw new Error(t('hero.generateError'))
      }
      // 2) 查询缓存
      const cacheRes = await fetch('/api/couplet/generate/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.trim(), language: locale }),
      })
      if (cacheRes.ok) {
        const cache = await cacheRes.json()
        const slug = cache?.data?.category?.slug
        const id = cache?.data?.id
        if (slug && id) {
          router.push(`/couplet/${slug}/${encodeURIComponent(aiPrompt)}/${id}`)
          return
        }
      }

      // 3) 基于提示词生成分类/标签
      const metaRes = await fetch('/api/couplet/generate/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.trim(), language: locale }),
      })
      const meta = await metaRes.json().catch(() => ({}))
      const description = aiPrompt.trim()
      const classification = metaRes.ok ? { category: meta?.data?.category, tags: meta?.data?.tags } : null

      // 4) 先创建对联入库
      const createRes = await fetch('/api/couplet/generate/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.trim(), description, classification, language: locale }),
      })
      const createData = await createRes.json()
      if (!createRes.ok || !createData?.success) {
        throw new Error(createData?.error || t('hero.generateError'))
      }
      // 成功后计数 +1（首次创建）
      try { await fetch('/api/couplet/generate/increment', { method: 'POST' }) } catch (_) {}
      const realId = createData?.data?.id
      const realSlug = createData?.data?.category?.slug
      router.push(`/couplet/${realSlug}/${encodeURIComponent(aiPrompt)}/${realId}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : t('hero.networkError'))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-orange-900/20">
      {/* 传统文化背景装饰 - 增强中国风元素 */}
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
        
        {/* 动态鼠标跟随效果 - 调整为中国风色彩 */}
        <div
          className="absolute w-96 h-96 rounded-full pointer-events-none transition-all duration-500"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
            background: 'radial-gradient(circle, rgba(220, 38, 38, 0.08) 0%, rgba(234, 88, 12, 0.05) 40%, transparent 70%)',
          }}
        />
      </div>

      {/* Hero Section - 重新设计为传统对联风格 */}
      <section className="relative overflow-hidden pb-16 mb-20">
        {/* 传统红色渐变背景 - 增强层次感 */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/15 via-orange-500/10 to-yellow-500/8" />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-red-50/30 to-transparent" />
        </div>
        
        {/* 传统纹样背景 */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-1/4 w-64 h-64">
            <svg viewBox="0 0 100 100" className="w-full h-full text-red-700">
              <pattern id="traditional-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="2" fill="currentColor" opacity="0.3"/>
                <path d="M5 10 Q10 5, 15 10 Q10 15, 5 10" fill="currentColor" opacity="0.2"/>
              </pattern>
              <rect width="100" height="100" fill="url(#traditional-pattern)"/>
            </svg>
          </div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* 传统印章风格标识 - 增强设计 */}
            <div className="inline-flex items-center justify-center w-24 h-24 mb-8 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="text-center">
                <span className="text-2xl font-black">联</span>
                <div className="w-4 h-0.5 bg-yellow-400 mx-auto mt-1"></div>
              </div>
            </div>
            
            {/* 主标题 - 采用传统书法风格 */}
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-6 tracking-wide">
              <span className="block bg-gradient-to-r from-red-600 via-orange-600 to-red-700 bg-clip-text text-transparent mb-2 drop-shadow-sm">
                {t('hero.title')}
              </span>
              <span className="block text-2xl md:text-3xl font-light text-gray-700 dark:text-gray-300 tracking-wider">
                <span className="text-red-600 dark:text-red-400">{t('hero.subtitle1')}</span>
                <span className="mx-4 text-orange-600 dark:text-orange-400">·</span>
                <span className="text-orange-600 dark:text-orange-400">{t('hero.subtitle2')}</span>
              </span>
            </h1>

            {/* 对联示例展示 - 增强传统风格 */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="relative bg-gradient-to-br from-white/90 to-red-50/90 dark:from-gray-800/90 dark:to-red-900/30 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-2 border-red-200/50 dark:border-red-800/50">
                {/* 传统装饰边框 */}
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-red-600 rounded-tl-lg"></div>
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-red-600 rounded-tr-lg"></div>
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-red-600 rounded-bl-lg"></div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-red-600 rounded-br-lg"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  {/* 上联 */}
                  <div className="text-center">
                    <div className="text-sm text-red-600 dark:text-red-400 mb-3 font-bold tracking-wider">{t('coupletCard.topLine')}</div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-relaxed tracking-wide">
                      {t('hero.exampleCouplet.topLine')}
                    </div>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-red-600 to-orange-600 mx-auto mt-2"></div>
                  </div>
                  
                  {/* 横批 */}
                  <div className="text-center order-first md:order-none">
                    <div className="inline-block relative">
                      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-2xl shadow-xl border-2 border-yellow-400">
                        <div className="text-sm mb-1 text-yellow-200 font-medium">{t('coupletCard.horizontal')}</div>
                        <div className="text-xl font-black tracking-wider">{t('hero.exampleCouplet.horizontal')}</div>
                      </div>
                      {/* 传统印章装饰 */}
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-red-800 text-xs font-bold">印</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 下联 */}
                  <div className="text-center">
                    <div className="text-sm text-red-600 dark:text-red-400 mb-3 font-bold tracking-wider">{t('coupletCard.bottomLine')}</div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-relaxed tracking-wide">
                      {t('hero.exampleCouplet.bottomLine')}
                    </div>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-orange-600 to-red-600 mx-auto mt-2"></div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12">
              {t('hero.description')}
              <br />
              <span className="text-base bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent font-bold tracking-wide">
                {t('hero.subDescription')}
              </span>
            </p>

            {/* AI生成输入区 - 重新设计为传统风格 */}
            <div className="max-w-3xl mx-auto mb-16">
              <div className="relative bg-gradient-to-br from-red-50/90 to-orange-50/90 dark:from-gray-800/90 dark:to-red-900/30 rounded-3xl shadow-2xl border-2 border-red-200/50 dark:border-red-800/50 p-8 focus-within:border-red-400 dark:focus-within:border-red-600 transition-all duration-300">
                {/* 传统装饰元素 */}
                <div className="absolute top-4 left-4 w-8 h-8 opacity-20">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
                    <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="4"/>
                    <path d="M35 50 Q50 35, 65 50 Q50 65, 35 50" fill="currentColor"/>
                  </svg>
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 opacity-20">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-orange-600">
                    <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="4"/>
                    <circle cx="50" cy="50" r="10" fill="currentColor"/>
                  </svg>
                </div>
                
                <div className="relative flex flex-col gap-6">
                  {/* 标题 */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
                      {t('hero.aiCreationTitle')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('hero.aiCreationDesc')}
                    </p>
                  </div>
                  
                  {/* 输入框 */}
                  <div className="relative">
                    <textarea
                      value={aiPrompt}
                      onChange={e => { setAiPrompt(e.target.value); setError('') }}
                      placeholder={t('hero.inputPlaceholder')}
                      rows={3}
                      className="w-full resize-none bg-white/95 dark:bg-gray-700/95 rounded-2xl px-6 py-4 text-gray-900 dark:text-white text-lg focus:outline-none focus:ring-4 focus:ring-red-400/30 focus:border-red-400 transition-all placeholder-gray-500 dark:placeholder-gray-400 border-2 border-red-100 dark:border-gray-600 shadow-inner"
                      disabled={isGenerating}
                    />
                    {/* 传统印章装饰 */}
                    <div className="absolute top-4 right-4 w-10 h-10 bg-gradient-to-br from-red-600/20 to-orange-600/20 rounded-full flex items-center justify-center border border-red-300/30">
                      <span className="text-red-600 dark:text-red-400 text-sm font-bold">联</span>
                    </div>
                  </div>
                  
                  {/* 生成按钮 */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleAIGenerate}
                      disabled={isGenerating || !aiPrompt.trim()}
                      className="relative px-10 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:from-red-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3 overflow-hidden"
                    >
                      {/* 按钮背景装饰 */}
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative text-xl">🎋</span>
                      <span className="relative">{isGenerating ? t('hero.generatingText') : t('hero.generateButtonText')}</span>
                      {isGenerating && (
                        <div className="relative w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      )}
                    </button>
                  </div>
                  
                  {error && (
                    <div className="text-red-600 text-center bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border-2 border-red-200 dark:border-red-800 shadow-inner">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-lg">⚠️</span>
                        <span className="font-medium">{error}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 使用提示 - 增强设计 */}
              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 rounded-full px-6 py-3 backdrop-blur-sm border border-red-100 dark:border-red-900/30">
                  <span className="text-lg">💡</span>
                  <span>{t('hero.usageTip')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 对联展示区块 */}
      <CoupletSection title={t('sections.hot.title')} desc={t('sections.hot.description')} couplets={hotCouplets} />
      
      <CoupletSection title={t('sections.latest.title')} desc={t('sections.latest.description')} couplets={latestCouplets} />
      
      <CoupletSection title={t('sections.featured.title')} desc={t('sections.featured.description')} couplets={featuredCouplets} />

      {/* 对联文化介绍区块 - 增强中国风设计 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl mb-6 shadow-lg">
            <span className="text-2xl font-black">文</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4">
            {t('culture.title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('culture.description')}
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-orange-600 mx-auto mt-4 rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* 对仗工整 */}
          <div className="group bg-gradient-to-br from-white/90 to-red-50/80 dark:from-gray-800/90 dark:to-red-900/30 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-red-100 dark:border-red-900/30 hover:shadow-2xl hover:border-red-300 dark:hover:border-red-700 transition-all duration-300 transform hover:-translate-y-2">
            <div className="text-center">
              <div className="relative w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-3xl text-red-600 dark:text-red-400">⚖️</span>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-red-800 text-xs font-bold">工</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">{t('culture.balance.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {t('culture.balance.description')}
              </p>
            </div>
          </div>

          {/* 平仄协调 */}
          <div className="group bg-gradient-to-br from-white/90 to-orange-50/80 dark:from-gray-800/90 dark:to-orange-900/30 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-orange-100 dark:border-orange-900/30 hover:shadow-2xl hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-300 transform hover:-translate-y-2">
            <div className="text-center">
              <div className="relative w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-3xl text-orange-600 dark:text-orange-400">🎵</span>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-red-800 text-xs font-bold">律</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">{t('culture.rhythm.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {t('culture.rhythm.description')}
              </p>
            </div>
          </div>

          {/* 意境深远 */}
          <div className="group bg-gradient-to-br from-white/90 to-yellow-50/80 dark:from-gray-800/90 dark:to-yellow-900/30 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-yellow-100 dark:border-yellow-900/30 hover:shadow-2xl hover:border-yellow-300 dark:hover:border-yellow-700 transition-all duration-300 transform hover:-translate-y-2">
            <div className="text-center">
              <div className="relative w-20 h-20 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-3xl text-yellow-600 dark:text-yellow-400">🌅</span>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-red-800 text-xs font-bold">意</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-300">{t('culture.meaning.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {t('culture.meaning.description')}
              </p>
            </div>
          </div>

          {/* 应用广泛 */}
          <div className="group bg-gradient-to-br from-white/90 to-green-50/80 dark:from-gray-800/90 dark:to-green-900/30 backdrop-blur-sm rounded-3xl p-8 shadow-lg border-2 border-green-100 dark:border-green-900/30 hover:shadow-2xl hover:border-green-300 dark:hover:border-green-700 transition-all duration-300 transform hover:-translate-y-2">
            <div className="text-center">
              <div className="relative w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-3xl text-green-600 dark:text-green-400">🏮</span>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-red-800 text-xs font-bold">用</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">{t('culture.application.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {t('culture.application.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 我们能做什么模块 - 重新设计 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('features.title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('features.description')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-red-100 dark:border-red-900/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl text-white">🧠</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('features.aiGeneration.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{t('features.aiGeneration.description')}</p>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-orange-100 dark:border-orange-900/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl text-white">📚</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('features.knowledgeSorting.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{t('features.knowledgeSorting.description')}</p>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-yellow-50 to-green-50 dark:from-yellow-900/20 dark:to-green-900/20 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-yellow-100 dark:border-yellow-900/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl text-white">🌐</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('features.multiModel.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{t('features.multiModel.description')}</p>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-green-100 dark:border-green-900/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl text-white">🎨</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('features.visualization.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{t('features.visualization.description')}</p>
            </div>
          </div>
        </div>
      </section>
      {/* 适用人群模块 - 重新设计 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('audience.title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('audience.description')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-blue-100 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-3xl text-white">👩‍🎓</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('audience.students.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{t('audience.students.description')}</p>
            </div>
          </div>

          <div className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-purple-100 dark:border-purple-900/30 hover:border-purple-300 dark:hover:border-purple-700">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-3xl text-white">🏢</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('audience.enterprises.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{t('audience.enterprises.description')}</p>
            </div>
          </div>

          <div className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-green-100 dark:border-green-900/30 hover:border-green-300 dark:hover:border-green-700">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-3xl text-white">📰</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('audience.media.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{t('audience.media.description')}</p>
            </div>
          </div>

          <div className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-orange-100 dark:border-orange-900/30 hover:border-orange-300 dark:hover:border-orange-700">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-3xl text-white">🤖</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('audience.developers.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{t('audience.developers.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 底部CTA区域 - 重新设计为传统风格 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-20">
        <div className="relative overflow-hidden">
          {/* 传统纹样背景 - 增强设计 */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/8 via-orange-500/6 to-yellow-500/8 rounded-3xl" />
          <div className="absolute top-0 left-0 w-40 h-40 opacity-8">
            <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
              <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="2"/>
              <path d="M30 50 Q50 30, 70 50 Q50 70, 30 50" fill="currentColor" opacity="0.3"/>
              <circle cx="50" cy="50" r="15" fill="currentColor" opacity="0.5"/>
            </svg>
          </div>
          <div className="absolute bottom-0 right-0 w-32 h-32 opacity-8">
            <svg viewBox="0 0 100 100" className="w-full h-full text-orange-600">
              <path d="M20 20 L80 20 L80 40 L40 40 L40 60 L80 60 L80 80 L20 80 L20 60 L60 60 L60 40 L20 40 Z" 
                    fill="none" stroke="currentColor" strokeWidth="2"/>
              <circle cx="50" cy="50" r="8" fill="currentColor" opacity="0.6"/>
            </svg>
          </div>
          
          <div className="relative bg-gradient-to-br from-white/90 to-red-50/80 dark:from-gray-800/90 dark:to-red-900/30 backdrop-blur-sm rounded-3xl p-12 border-2 border-red-200/50 dark:border-red-800/50 shadow-2xl text-center">
            {/* 传统装饰边框 */}
            <div className="absolute -top-3 -left-3 w-12 h-12 border-t-4 border-l-4 border-red-600 rounded-tl-2xl"></div>
            <div className="absolute -top-3 -right-3 w-12 h-12 border-t-4 border-r-4 border-red-600 rounded-tr-2xl"></div>
            <div className="absolute -bottom-3 -left-3 w-12 h-12 border-b-4 border-l-4 border-red-600 rounded-bl-2xl"></div>
            <div className="absolute -bottom-3 -right-3 w-12 h-12 border-b-4 border-r-4 border-red-600 rounded-br-2xl"></div>
            
            <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-3xl mb-8 shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="text-center">
                <span className="text-3xl font-black">联</span>
                <div className="w-6 h-0.5 bg-yellow-400 mx-auto mt-1"></div>
              </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-6">
              {t('cta.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              {t('cta.description')}
            </p>
            
            {/* 传统对联格式的CTA - 增强设计 */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-red-50/90 to-orange-50/90 dark:from-red-900/30 dark:to-orange-900/30 rounded-3xl p-8 border-2 border-red-200 dark:border-red-800 shadow-lg">
                <div className="grid grid-cols-3 gap-6 items-center text-center">
                  <div className="group">
                    <div className="text-sm text-red-600 dark:text-red-400 mb-3 font-bold tracking-wider">{t('ctaSection.topLine')}</div>
                    <div className="text-xl font-black text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">{t('ctaSection.topText')}</div>
                    <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-orange-600 mx-auto mt-2"></div>
                  </div>
                  <div className="group">
                    <div className="relative inline-block">
                      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 rounded-2xl text-lg font-black shadow-xl hover:shadow-2xl transition-shadow duration-300 cursor-pointer transform hover:scale-105">
                        {t('ctaSection.buttonText')}
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-red-800 text-xs font-bold">印</span>
                      </div>
                    </div>
                  </div>
                  <div className="group">
                    <div className="text-sm text-red-600 dark:text-red-400 mb-3 font-bold tracking-wider">{t('ctaSection.bottomLine')}</div>
                    <div className="text-xl font-black text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">{t('ctaSection.bottomText')}</div>
                    <div className="w-12 h-0.5 bg-gradient-to-r from-orange-600 to-red-600 mx-auto mt-2"></div>
                  </div>
                </div>
                
                {/* 横批 */}
                <div className="text-center mt-6">
                  <div className="inline-block bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-2 rounded-xl text-sm font-bold tracking-wider">
                    {t('ctaSection.horizontal')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
