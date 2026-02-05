'use client'

import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'

function ComicSection({ title, desc, comics = [] }: { title: string; desc: string; comics?: any[] }) {
  const t = useTranslations('main.home.comicCard')
  const router = useRouter()

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 mt-0">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">{title}</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">{desc}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {comics.map((item, index) => {
          return (
            <div
              key={item.id}
              className="group relative bg-gradient-to-br from-white/95 to-purple-50/80 dark:from-gray-800/95 dark:to-purple-900/30 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 p-6 border-2 border-purple-100/50 dark:border-purple-800/50 hover:border-purple-300 dark:hover:border-purple-600 overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* 漫画装饰背景 */}
              <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
                <svg viewBox="0 0 100 100" className="w-full h-full text-purple-600">
                  <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="3"/>
                  <circle cx="50" cy="50" r="15" fill="currentColor"/>
                </svg>
              </div>
              
              {/* 分类标签 */}
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse" />
                  {item?.category?.name || '漫画'}
                </div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl flex items-center justify-center text-sm font-black shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
                  <span>漫</span>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
                </div>
              </div>

              {/* 标题 */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300 tracking-wide">
                {item.title}
              </h3>

              {/* 漫画封面展示区 */}
              <div className="relative mb-6">
                <div className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl overflow-hidden border-2 border-purple-200 dark:border-purple-800">
                  {item.coverImage ? (
                    <img 
                      src={item.coverImage} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-2">🎨</div>
                        <div className="text-purple-600 dark:text-purple-400 font-medium">AI漫画</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 漫画信息 */}
                <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded-xl p-3 text-white">
                  <div className="flex items-center justify-between text-xs">
                    <span>{item.episodeCount || 1} 话</span>
                    <span>{item.style || '未知风格'}</span>
                  </div>
                </div>
              </div>

              {/* 描述 */}
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                {item.description || '这是一个精彩的AI生成漫画故事...'}
              </p>

              {/* 操作按钮和统计 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-gray-400 dark:text-gray-500 text-xs">
                  <span className="flex items-center gap-1">
                    <span>👁️</span>
                    {item.viewCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>❤️</span>
                    {item.likeCount || 0}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    router.push(`/comic/${item.id}`)
                  }}
                  className="relative px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl text-sm font-bold hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer flex items-center gap-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative text-lg">📖</span>
                  <span className="relative">阅读</span>
                </button>
              </div>

              {/* 悬停光效 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-3xl pointer-events-none" />
            </div>
          )
        })}
        {comics.length === 0 && (
          <div className="col-span-3 text-center text-gray-400 py-12">
            <div className="text-6xl mb-4">🎨</div>
            <div className="text-lg">暂无漫画</div>
            <div className="text-sm text-gray-500 mt-2">快来创作第一个AI漫画吧！</div>
          </div>
        )}
      </div>
    </section>
  )
}

export default function ClientHomePage({ hotComics = [], latestComics = [], featuredComics = [] }: {
  hotComics?: any[], latestComics?: any[], featuredComics?: any[]
}) {
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

  // AI生成漫画 - 用户只需输入想法，AI自动生成完整漫画
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      setError(t('hero.enterPrompt'))
      return
    }

    setIsGenerating(true)
    setError('')
    
    try {
      // 1. 检查生成限额
      const limitResponse = await fetch('/api/comic/generate/check-limit', { 
        method: 'POST' 
      })
      const limitData = await limitResponse.json()

      if (limitResponse.status === 429 && !limitData?.data?.allowed) {
        throw new Error(t('hero.limitExceeded'))
      }
      if (!limitResponse.ok) {
        throw new Error(t('hero.generateError'))
      }

      // 2. 检查缓存（避免重复生成相同内容）
      const cacheResponse = await fetch('/api/comic/generate/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: aiPrompt.trim(), 
          language: locale 
        }),
      })
      
      if (cacheResponse.ok) {
        const cacheData = await cacheResponse.json()
        if (cacheData?.success && cacheData?.data?.id) {
          const { category, id } = cacheData.data
          router.push(`/comic/${category?.slug || 'ai-generated'}/${encodeURIComponent(aiPrompt)}/${id}`)
          return
        }
      }

      // 3. 使用DeepSeek生成漫画完整内容
      // 包括：标题、描述、分类、标签、风格、分镜剧本（每个分镜包含场景描述、对话、情感、镜头角度）
      const metaResponse = await fetch('/api/comic/generate/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: aiPrompt.trim(), 
          model: 'deepseek-chat',
          language: locale 
        }),
      })
      
      const metaData = await metaResponse.json()
      if (!metaResponse.ok || !metaData.success) {
        throw new Error(metaData.error || '漫画剧本生成失败')
      }

      const { title, description, category, tags, style, volumes } = metaData.data

      // 4. 创建漫画数据库记录
      const createResponse = await fetch('/api/comic/generate/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: aiPrompt.trim(), 
          title, 
          description, 
          category, 
          tags,
          style,
          volumes,
          language: locale 
        }),
      })
      
      const createData = await createResponse.json()
      if (!createResponse.ok || !createData?.success) {
        throw new Error(createData?.error || '创建漫画记录失败')
      }

      const comicId = createData.data.id
      const categorySlug = createData.data.category?.slug || 'ai-generated'

      // 5. 使用wan2.6-t2i生成封面图片
      const coverResponse = await fetch('/api/comic/generate/cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          style,
          comicId
        }),
      })

      const coverData = await coverResponse.json()
      if (!coverData.success) {
        console.warn('封面生成失败:', coverData.error)
        // 封面生成失败不阻断流程
      }

      // 6. 使用AI为每个分镜生成图片
      const imagesResponse = await fetch('/api/comic/generate/panels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volumes, // 包含完整的卷、话、分镜信息
          style,
          comicId
        }),
      })

      const imagesData = await imagesResponse.json()
      if (!imagesData.success) {
        console.warn('分镜图片生成失败:', imagesData.error)
        // 图片生成失败不阻断流程
      }

      // 7. 更新漫画图片URL
      const saveResponse = await fetch('/api/comic/generate/update-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comicId,
          coverUrl: coverData?.data?.coverUrl || null,
          volumes, // 完整的卷结构数据，包含所有话和分镜信息
          imageUrls: imagesData?.data?.imageUrls || [],
          style
        }),
      })

      if (!saveResponse.ok) {
        const saveError = await saveResponse.json()
        throw new Error(saveError?.error || '更新图片URL失败')
      }

      // 8. 增加生成计数
      try {
        await fetch('/api/comic/generate/increment', { method: 'POST' })
      } catch (error) {
        console.warn('计数更新失败:', error)
      }
      
      // 9. 跳转到漫画详情页
      router.push(`/comic/${categorySlug}/${encodeURIComponent(aiPrompt)}/${comicId}`)
      
    } catch (error) {
      console.error('AI漫画生成失败:', error)
      setError(error instanceof Error ? error.message : t('hero.networkError'))
    } finally {
      setIsGenerating(false)
    }
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

      {/* Hero Section - AI漫画创作 */}
      <section className="relative overflow-hidden pb-16 mb-20">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/15 via-pink-500/10 to-blue-500/8" />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-purple-50/30 to-transparent" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* 漫画风格标识 */}
            <div className="inline-flex items-center justify-center w-24 h-24 mb-8 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="text-center">
                <span className="text-2xl font-black">漫</span>
                <div className="w-4 h-0.5 bg-yellow-400 mx-auto mt-1"></div>
              </div>
            </div>
            
            {/* 主标题 */}
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-6 tracking-wide">
              <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2 drop-shadow-sm">
                AI漫画创作平台
              </span>
              <span className="block text-2xl md:text-3xl font-light text-gray-700 dark:text-gray-300 tracking-wider">
                <span className="text-purple-600 dark:text-purple-400">智能生成</span>
                <span className="mx-4 text-pink-600 dark:text-pink-400">·</span>
                <span className="text-blue-600 dark:text-blue-400">无限创意</span>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12">
              用AI的力量释放你的创意，只需输入想法，即可全自动生成精美的漫画故事
              <br />
              <span className="text-base bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold tracking-wide">
                AI智能分析内容，自动选择最佳风格和帧数
              </span>
            </p>

            {/* AI生成输入区 */}
            <div className="max-w-4xl mx-auto mb-16">
              <div className="relative bg-gradient-to-br from-purple-50/90 to-pink-50/90 dark:from-gray-800/90 dark:to-purple-900/30 rounded-3xl shadow-2xl border-2 border-purple-200/50 dark:border-purple-800/50 p-8 focus-within:border-purple-400 dark:focus-within:border-purple-600 transition-all duration-300">
                
                <div className="relative flex flex-col gap-6">
                  {/* 标题 */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                      🎨 AI漫画生成器
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      描述你想要的漫画故事，AI将智能分析并全自动生成
                    </p>
                  </div>
                  
                  {/* 输入框 */}
                  <div className="relative">
                    <textarea
                      value={aiPrompt}
                      onChange={e => { setAiPrompt(e.target.value); setError('') }}
                      placeholder="例如：一个勇敢的少年在魔法森林中寻找传说中的宝藏..."
                      rows={3}
                      className="w-full resize-none bg-white/95 dark:bg-gray-700/95 rounded-2xl px-6 py-4 text-gray-900 dark:text-white text-lg focus:outline-none focus:ring-4 focus:ring-purple-400/30 focus:border-purple-400 transition-all placeholder-gray-500 dark:placeholder-gray-400 border-2 border-purple-100 dark:border-gray-600 shadow-inner"
                      disabled={isGenerating}
                    />
                  </div>
                  
                  {/* 生成按钮 */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleAIGenerate}
                      disabled={isGenerating || !aiPrompt.trim()}
                      className="relative px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative text-xl">🎨</span>
                      <span className="relative">{isGenerating ? '正在生成中...' : '开始创作漫画'}</span>
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
              
              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 rounded-full px-6 py-3 backdrop-blur-sm border border-purple-100 dark:border-purple-900/30">
                  <span className="text-lg">💡</span>
                  <span>AI将根据你的描述自动选择最适合的风格和帧数</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 漫画展示区块 */}
      <ComicSection title="🔥 热门漫画" desc="最受欢迎的AI生成漫画作品" comics={hotComics} />
      
      <ComicSection title="✨ 最新漫画" desc="刚刚创作完成的新鲜漫画" comics={latestComics} />
      
      <ComicSection title="⭐ 精选漫画" desc="编辑精心挑选的优质漫画" comics={featuredComics} />

      {/* 功能介绍区块 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🚀 强大功能
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            AI驱动的漫画创作平台，让每个人都能成为漫画家
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-purple-100 dark:border-purple-900/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl text-white">🧠</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">AI智能生成</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">先进的AI算法，根据你的描述生成精美漫画</p>
            </div>
          </div>

          <div className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-pink-100 dark:border-pink-900/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl text-white">🎨</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">多种风格</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">AI智能分析内容，自动选择最适合的漫画风格</p>
            </div>
          </div>

          <div className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-blue-100 dark:border-blue-900/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl text-white">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">快速创作</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">几分钟内完成漫画创作，效率提升百倍</p>
            </div>
          </div>

          <div className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-green-100 dark:border-green-900/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl text-white">🌐</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">在线分享</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">一键分享你的作品，与全世界的创作者交流</p>
            </div>
          </div>
        </div>
      </section>

      {/* 底部CTA区域 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-20">
        <div className="relative overflow-hidden">
          <div className="relative bg-gradient-to-br from-white/90 to-purple-50/80 dark:from-gray-800/90 dark:to-purple-900/30 backdrop-blur-sm rounded-3xl p-12 border-2 border-purple-200/50 dark:border-purple-800/50 shadow-2xl text-center">
            
            <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-3xl mb-8 shadow-xl">
              <span className="text-3xl font-black">🎨</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
              开始你的漫画创作之旅
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              无需绘画技能，无需复杂软件，只需要你的想象力。让AI帮你实现漫画梦想！
            </p>
            
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="relative px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl text-lg font-bold hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer flex items-center gap-3 mx-auto overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative text-xl">🚀</span>
              <span className="relative">立即开始创作</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}