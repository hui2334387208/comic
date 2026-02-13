'use client'
import dayjs from 'dayjs'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

import SmartSearch, { SearchResult } from '@/components/search/SmartSearch'
import { useLocale, useTranslations } from 'next-intl'

// API 数据类型定义
interface Comic {
  id: number;
  title: string;
  description: string;
  authorId?: string | number;
  author?: string;
  category?: {
    id: number;
    name: string;
    slug: string;
    icon?: string;
    color?: string;
  } | null;
  coverImage?: string;
  volumeCount?: number;
  episodeCount?: number;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  tags?: Array<{
    id: number;
    name: string;
    slug: string;
    color?: string;
  }>;
  style?: string;
  contents?: {
    upperLine?: string;
    lowerLine?: string;
    horizontalScroll?: string;
  }[];
}
interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  count?: number;
}
interface Tag {
  id: number;
  name: string;
  slug: string;
  color?: string;
}

interface ClientComicListPageProps {
  comics: Comic[];
  categories: Category[];
  tags: Tag[];
  totalPages: number;
  initialPage: number;
  initialSort: 'latest' | 'hot' | 'contents';
  initialCategory: string;
  initialSearch: string;
}

export default function ClientComicListPage({
  comics: initialComics,
  categories: initialCategories,
  tags: initialTags,
  totalPages: initialTotalPages,
  initialPage,
  initialSort,
  initialCategory,
  initialSearch,
}: ClientComicListPageProps) {
  const router = useRouter()
  // 状态
  const [comics, setComics] = useState<Comic[]>(initialComics)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [tags, setTags] = useState<Tag[]>(initialTags)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [sort, setSort] = useState<'latest' | 'hot' | 'contents'>(initialSort)
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [search, setSearch] = useState(initialSearch)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const isFirstRender = useRef(true)
  const t = useTranslations('main.comic') // 使用漫画翻译
  const locale = useLocale()

  // 仅在交互时 fetch 数据
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: '12',
      sort,
      language: locale
    })
    if (selectedCategory && selectedCategory !== 'all') {
      params.append('category', selectedCategory)
    }
    if (search) {
      params.append('search', search)
    }
    fetch(`/api/comic?${params.toString()}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setComics(res.data.comics || [])
          setTotalPages(res.data.pagination?.totalPages || 1)
        }
      })
      .finally(() => setLoading(false))
  }, [page, sort, selectedCategory, search])

  // 加载分类
  useEffect(() => {
    fetch('/api/comic/categories')
      .then(res => res.json())
      .then((data: any[]) => {
        setCategories([
          { id: 0, name: t('allCategories') || '全部分类', slug: 'all', count: undefined },
          ...data.map((c: any) => ({
            id: c.id,
            name: c.name || '',
            slug: c.slug,
            icon: c.icon,
            color: c.color,
            count: undefined,
          })),
        ])
      })
  }, [])

  // 加载标签
  useEffect(() => {
    fetch('/api/comic/tags')
      .then(res => res.json())
      .then((data: Tag[]) => {
        setTags(data.map((t: any) => ({
          id: t.id,
          name: t.name || '',
          slug: t.slug,
        })))
      })
  }, [])

  // 搜索
  const handleSearch = (query: string) => {
    setSearch(query)
    setPage(1)
  }

  const handleResultSelect = (result: SearchResult) => {
    // 可实现跳转
  }

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY-MM-DD')
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* 漫画风格背景装饰 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* 漫画泡泡装饰 */}
        <div className="absolute top-10 left-10 w-40 h-40 opacity-5 dark:opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-purple-600">
            <ellipse cx="50" cy="40" rx="30" ry="25" fill="currentColor" opacity="0.6"/>
            <circle cx="35" cy="70" r="8" fill="currentColor" opacity="0.8"/>
            <circle cx="45" cy="75" r="5" fill="currentColor" opacity="0.6"/>
          </svg>
        </div>
        
        {/* 漫画框装饰 */}
        <div className="absolute top-32 right-20 w-32 h-32 opacity-5 dark:opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-pink-600">
            <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="3"/>
            <path d="M30 30 L70 30 L70 70 L30 70 Z" fill="currentColor" opacity="0.3"/>
          </svg>
        </div>
        
        {/* 星星装饰 */}
        <div className="absolute bottom-20 left-20 w-36 h-36 opacity-5 dark:opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-blue-600">
            <path d="M50 10 L60 40 L90 40 L68 58 L78 88 L50 70 L22 88 L32 58 L10 40 L40 40 Z" 
                  fill="currentColor" opacity="0.4"/>
          </svg>
        </div>
        
        {/* 闪电装饰 */}
        <div className="absolute bottom-32 right-32 w-28 h-28 opacity-5 dark:opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-yellow-600">
            <path d="M30 10 L70 10 L50 50 L80 50 L40 90 L60 50 L30 50 Z" 
                  fill="currentColor"/>
          </svg>
        </div>
      </div>

      {/* 页面头部 */}
      <div className="relative overflow-hidden">
        {/* 漫画风格渐变背景 */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/15 via-pink-500/10 to-blue-500/8" />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-purple-50/30 to-transparent" />
        </div>
        
        {/* 漫画网点背景 */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-1/4 w-64 h-64">
            <svg viewBox="0 0 100 100" className="w-full h-full text-purple-700">
              <pattern id="comic-dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="2" fill="currentColor" opacity="0.3"/>
              </pattern>
              <rect width="100" height="100" fill="url(#comic-dots)"/>
            </svg>
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            {/* 漫画风格标识 */}
            <div className="inline-flex items-center justify-center w-20 h-20 mb-8 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="text-center">
                <span className="text-2xl font-black">漫</span>
                <div className="w-4 h-0.5 bg-yellow-400 mx-auto mt-1"></div>
              </div>
            </div>

            <h1 className="text-4xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-wide">
              <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2 drop-shadow-sm">
                {t('exploreTitle') || 'AI漫画世界'}
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
              {t('exploreDesc') || '探索AI生成的精彩漫画世界，发现无限创意与想象力'}
            </p>

            {/* 搜索框 - 漫画风格 */}
            <div className="max-w-2xl mx-auto">
              <div className="relative bg-gradient-to-br from-purple-50/90 to-pink-50/90 dark:from-gray-800/90 dark:to-purple-900/30 rounded-3xl shadow-2xl border-2 border-purple-200/50 dark:border-purple-800/50 p-6 focus-within:border-purple-400 dark:focus-within:border-purple-600 transition-all duration-300">
                {/* 漫画装饰元素 */}
                <div className="absolute top-4 left-4 w-6 h-6 opacity-20">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-purple-600">
                    <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="4"/>
                    <circle cx="50" cy="50" r="15" fill="currentColor"/>
                  </svg>
                </div>
                <div className="absolute top-4 right-4 w-6 h-6 opacity-20">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-pink-600">
                    <path d="M50 10 L60 40 L90 40 L68 58 L78 88 L50 70 L22 88 L32 58 L10 40 L40 40 Z" fill="currentColor"/>
                  </svg>
                </div>
                
                <SmartSearch
                  onSearch={handleSearch}
                  onResultSelect={handleResultSelect}
                  placeholder={t('searchPlaceholder') || '搜索漫画标题、作者或描述...'}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧边栏 */}
          <div className="lg:col-span-1">
            {/* 分类筛选 */}
            <div className="bg-gradient-to-br from-white/95 to-purple-50/80 dark:from-gray-800/95 dark:to-purple-900/30 rounded-3xl p-6 shadow-xl border-2 border-purple-100/50 dark:border-purple-800/50 mb-6 backdrop-blur-sm">
              {/* 漫画装饰 */}
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-xl flex items-center justify-center mr-3 shadow-lg">
                  <span className="text-sm font-black">类</span>
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{t('categoryFilter') || '分类筛选'}</h3>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {categories.length <= 1 ? (
                  <div className="text-gray-400 text-sm text-center py-4">{t('noCategory') || '暂无分类'}</div>
                ) : (
                  categories.map((category) => (
                    <button
                      key={category.id || category.slug}
                      onClick={() => {
                        setSelectedCategory(category.slug)
                        setPage(1)
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-all duration-300 transform hover:scale-105 ${
                        selectedCategory === category.slug
                          ? 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 text-purple-800 dark:text-purple-200 shadow-lg border-2 border-purple-200 dark:border-purple-700'
                          : 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 text-gray-700 dark:text-gray-300 border-2 border-transparent'
                      }`}
                    >
                      <span className="font-medium">{category.name}</span>
                      {category.count !== undefined && (
                        <span className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full font-bold shadow-sm">
                          {category.count}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* 热门标签 */}
            <div className="bg-gradient-to-br from-white/95 to-pink-50/80 dark:from-gray-800/95 dark:to-pink-900/30 rounded-3xl p-6 shadow-xl border-2 border-pink-100/50 dark:border-pink-800/50 backdrop-blur-sm">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-600 to-purple-600 text-white rounded-xl flex items-center justify-center mr-3 shadow-lg">
                  <span className="text-sm font-black">标</span>
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{t('hotTags') || '热门标签'}</h3>
              </div>
              <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto pr-2">
                {tags.length === 0 ? (
                  <div className="text-gray-400 text-sm text-center py-4 w-full">{t('noTag') || '暂无标签'}</div>
                ) : (
                  tags.map((tag) => (
                    <span
                      key={tag.id || tag.slug}
                      className="px-3 py-2 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/40 dark:to-purple-900/40 text-pink-700 dark:text-pink-300 rounded-full text-sm hover:from-pink-200 hover:to-purple-200 dark:hover:from-pink-800/60 dark:hover:to-purple-800/60 transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-sm border border-pink-200 dark:border-pink-800 font-medium"
                    >
                      #{tag.name}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 右侧漫画列表 */}
          <div className="lg:col-span-3">
            {/* 排序和筛选 */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-lg flex items-center justify-center mr-2 shadow-sm">
                    <span className="text-xs font-black">总</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 font-medium">{t('totalComics', { count: comics.length })}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => { setSort('latest'); setPage(1) }} className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${sort === 'latest' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-700 dark:text-purple-300 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/40 dark:hover:to-pink-800/40 border border-purple-200 dark:border-purple-800'}`}>{t('sortLatest') || '最新'}</button>
                  <button onClick={() => { setSort('hot'); setPage(1) }} className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${sort === 'hot' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-700 dark:text-purple-300 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/40 dark:hover:to-pink-800/40 border border-purple-200 dark:border-purple-800'}`}>{t('sortHot') || '热门'}</button>
                  <button onClick={() => { setSort('contents'); setPage(1) }} className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${sort === 'contents' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-700 dark:text-purple-300 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/40 dark:hover:to-pink-800/40 border border-purple-200 dark:border-purple-800'}`}>{t('sortContents') || '内容'}</button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className={`p-3 rounded-2xl transition-all duration-300 transform hover:scale-105 ${viewMode === 'list' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800'}`}
                  onClick={() => setViewMode('list')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  className={`p-3 rounded-2xl transition-all duration-300 transform hover:scale-105 ${viewMode === 'grid' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800'}`}
                  onClick={() => setViewMode('grid')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 漫画网格/列表 */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {loading ? (
                  <div className="col-span-full text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl mb-4 animate-pulse">
                      <span className="text-2xl font-black">漫</span>
                    </div>
                    <div className="text-gray-400">{t('loading') || '加载中...'}</div>
                  </div>
                ) : comics.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="text-6xl mb-4">�</div>
                    <div className="text-gray-400">{t('notFound') || '暂无漫画'}</div>
                  </div>
                ) : (
                  comics.map((comic, index) => {
                    const categorySlug = comic.category?.slug || 'uncategorized'
                    const promptSlug = comic.title ? encodeURIComponent(comic.title.substring(0, 50)) : 'comic'
                    
                    return (
                      <div
                        key={comic.id}
                        onClick={() => router.push(`/${locale}/comic/${categorySlug}/${promptSlug}/${comic.id}`)}
                        className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden cursor-pointer border border-gray-100 dark:border-gray-700"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* 封面图片区域 */}
                        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                          {comic.coverImage ? (
                            <img 
                              src={comic.coverImage} 
                              alt={comic.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-6xl mb-2">🎨</div>
                                <div className="text-purple-600 dark:text-purple-400 font-medium text-sm">AI漫画</div>
                              </div>
                            </div>
                          )}
                          
                          {/* 分类标签 */}
                          {comic.category && (
                            <div className="absolute top-3 left-3">
                              <div 
                                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border shadow-lg"
                                style={{
                                  backgroundColor: comic.category.color ? `${comic.category.color}20` : 'rgba(147, 51, 234, 0.2)',
                                  borderColor: comic.category.color || '#9333ea',
                                  color: comic.category.color || '#9333ea'
                                }}
                              >
                                {comic.category.icon && <span className="mr-1">{comic.category.icon}</span>}
                                {comic.category.name}
                              </div>
                            </div>
                          )}
                          
                          {/* 悬停遮罩 */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          {/* 悬停时显示的快速信息 */}
                          <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <div className="flex items-center justify-between text-white text-sm">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <span>{formatNumber(comic.viewCount)}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                  <span>{formatNumber(comic.likeCount)}</span>
                                </span>
                              </div>
                              {comic.style && (
                                <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-xs">
                                  {comic.style}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 内容区域 */}
                        <div className="p-5">
                          {/* 标题 */}
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                            {comic.title}
                          </h3>

                          {/* 描述 */}
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                            {comic.description || '这是一个精彩的AI生成漫画故事...'}
                          </p>

                          {/* 标签 */}
                          {comic.tags && comic.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {comic.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                                >
                                  #{tag.name}
                                </span>
                              ))}
                              {comic.tags.length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                  +{comic.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* 章节信息 */}
                          {((comic.volumeCount || 0) > 0 || (comic.episodeCount || 0) > 0) && (
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
                              {(comic.volumeCount || 0) > 0 && (
                                <span className="flex items-center gap-1">
                                  <span>📚</span>
                                  <span>{comic.volumeCount} 卷</span>
                                </span>
                              )}
                              {(comic.episodeCount || 0) > 0 && (
                                <span className="flex items-center gap-1">
                                  <span>📖</span>
                                  <span>{comic.episodeCount} 话</span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* 底部：作者、时间、阅读按钮 */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                              {/* 作者信息 */}
                              {comic.author && (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                                    {comic.author[0]?.toUpperCase()}
                                  </div>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {comic.author}
                                  </span>
                                </div>
                              )}
                              {/* 时间 */}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(comic.createdAt)}
                              </span>
                            </div>
                            
                            {/* 阅读按钮 */}
                            <button 
                              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                            >
                              <span>📖</span>
                              <span>阅读</span>
                            </button>
                          </div>
                        </div>

                        {/* 悬停光效 */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                      </div>
                    )
                  })
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl mb-4 animate-pulse">
                      <span className="text-2xl font-black">漫</span>
                    </div>
                    <div className="text-gray-400">{t('loading') || '加载中...'}</div>
                  </div>
                ) : comics.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">�</div>
                    <div className="text-gray-400">{t('notFound') || '暂无漫画'}</div>
                  </div>
                ) : (
                  comics.map((comic) => {
                    return (
                      <div
                        key={comic.id}
                        onClick={() => {
                          // 跳转到漫画详情页
                          router.push(`/comic/${comic.category?.slug}/${encodeURIComponent(comic.title)}/${comic.id}`)
                        }}
                        className="group flex bg-gradient-to-br from-white/95 to-purple-50/80 dark:from-gray-800/95 dark:to-purple-900/30 rounded-3xl shadow-xl border-2 border-purple-100/50 dark:border-purple-800/50 p-6 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 cursor-pointer backdrop-blur-sm transform hover:-translate-y-1"
                      >
                        {/* 左侧漫画封面区 */}
                        <div className="flex-shrink-0 w-80 mr-6">
                          {/* 标题 */}
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300 tracking-wide">
                            {comic.title}
                          </h3>
                          
                          {/* 漫画封面 */}
                          <div className="relative">
                            <div className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl overflow-hidden border-2 border-purple-200 dark:border-purple-800 shadow-inner">
                              {comic.coverImage ? (
                                <img 
                                  src={comic.coverImage} 
                                  alt={comic.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="text-4xl mb-2">🎨</div>
                                    <div className="text-purple-600 dark:text-purple-400 font-medium text-sm">AI漫画</div>
                                  </div>
                                </div>
                              )}
                              
                              {/* 漫画信息覆盖层 */}
                              <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded-xl p-2 text-white">
                                <div className="flex items-center justify-between text-xs">
                                  {(comic.volumeCount || 0) > 0 && <span>📚 {comic.volumeCount} 卷</span>}
                                  {(comic.episodeCount || 0) > 0 && <span>📖 {comic.episodeCount} 话</span>}
                                  {comic.style && <span>{comic.style}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* 右侧信息区 */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center">
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800">
                                  {comic.category?.name || t('uncategorized') || '未分类'}
                                </span>
                              </div>
                              <div className="relative w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-xl flex items-center justify-center text-xs font-black shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
                                <span>漫</span>
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
                              </div>
                            </div>
                            
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-3 line-clamp-2">
                              {comic.description || '这是一个精彩的AI生成漫画故事...'}
                            </p>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              {(comic.tags || []).slice(0, 4).map((tag) => (
                                <span key={tag.id} className="px-2 py-1 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/40 dark:to-purple-900/40 text-pink-700 dark:text-pink-300 rounded-full text-xs font-medium border border-pink-200 dark:border-pink-800">
                                  #{tag.name}
                                </span>
                              ))}
                              {(comic.tags || []).length > 4 && (
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-xs">
                                  +{(comic.tags || []).length - 4}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-lg">
                                <svg className="w-3 h-3 mr-1 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {formatNumber(comic.viewCount)}
                              </span>
                              <span className="flex items-center bg-pink-50 dark:bg-pink-900/20 px-2 py-1 rounded-lg">
                                <svg className="w-3 h-3 mr-1 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                {formatNumber(comic.likeCount)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 font-medium">
                                {comic.author || t('unknown') || '未知'}
                              </span>
                              <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                                {formatDate(comic.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* 分页 - 漫画风格 */}
            <div className="flex items-center justify-center mt-16">
              <nav className="flex items-center space-x-3">
                <button 
                  onClick={() => setPage(page - 1)} 
                  disabled={page === 1} 
                  className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-600 dark:text-purple-400 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/40 dark:hover:to-pink-800/40 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl border-2 border-purple-200 dark:border-purple-800 transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {Array.from({ length: Math.min(totalPages, 7) }).map((_, idx) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = idx + 1;
                  } else if (page <= 4) {
                    pageNum = idx + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + idx;
                  } else {
                    pageNum = page - 3 + idx;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`flex items-center justify-center w-12 h-12 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                        page === pageNum 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-2 border-purple-700' 
                          : 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-700 dark:text-purple-300 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/40 dark:hover:to-pink-800/40 border-2 border-purple-200 dark:border-purple-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button 
                  onClick={() => setPage(page + 1)} 
                  disabled={page === totalPages} 
                  className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-600 dark:text-purple-400 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/40 dark:hover:to-pink-800/40 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl border-2 border-purple-200 dark:border-purple-800 transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}