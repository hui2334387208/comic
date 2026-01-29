'use client'
import dayjs from 'dayjs'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

import SmartSearch, { SearchResult } from '@/components/search/SmartSearch'
import { useLocale, useTranslations } from 'next-intl'

// API 数据类型定义
interface Couplet {
  id: number;
  title: string;
  description: string;
  authorId?: string | number;
  author?: string;
  category?: {
    id: number;
    name: string;
    slug: string;
    color?: string;
  } | null;
  coverImage?: string;
  contentCount?: number;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  tags?: string[];
  model?: string;
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
  count?: number;
}
interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface ClientCoupletListPageProps {
  couplets: Couplet[];
  categories: Category[];
  tags: Tag[];
  totalPages: number;
  initialPage: number;
  initialSort: 'latest' | 'hot' | 'contents';
  initialCategory: string;
  initialSearch: string;
}

export default function ClientCoupletListPage({
  couplets: initialCouplets,
  categories: initialCategories,
  tags: initialTags,
  totalPages: initialTotalPages,
  initialPage,
  initialSort,
  initialCategory,
  initialSearch,
}: ClientCoupletListPageProps) {
  const router = useRouter()
  // 状态
  const [couplets, setCouplets] = useState<Couplet[]>(initialCouplets)
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
  const t = useTranslations('main.couplet') // 使用对联翻译
  const locale = useLocale()

  // 仅在交互时 fetch 数据（API路径保持不变）
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
    fetch(`/api/couplet?${params.toString()}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setCouplets(
            (res.data.couplets || []).map((item: any) => ({
              id: item.id,
              title: item.title || '',
              description: item.description || '',
              authorId: item.authorId,
              author: item.author?.name || item.author?.username || t('unknown'),
              category: item.category || {},
              coverImage: item.coverImage,
              contentCount: item.contentCount || 0,
              viewCount: item.viewCount,
              likeCount: item.likeCount,
              createdAt: item.createdAt,
              tags: Array.isArray(item.tags) ? item.tags.map((t: any) => t.name || t) : [],
              model: item.model,
              type: item.type,
              contents: item.contents || [],
            })),
          )
          setTotalPages(res.data.pagination?.totalPages || 1)
        }
      })
      .finally(() => setLoading(false))
  }, [page, sort, selectedCategory, search])

  // 加载分类
  useEffect(() => {
    fetch('/api/couplet/categories')
      .then(res => res.json())
      .then((data: Category[]) => {
        setCategories([
          { id: 0, name: t('allCategories'), slug: 'all', count: undefined },
          ...data.map((c: any) => ({
            id: c.id,
            name: c.name || '',
            slug: c.slug,
            count: undefined,
          })),
        ])
      })
  }, [])

  // 加载标签
  useEffect(() => {
    fetch('/api/couplet/tags')
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

      {/* 页面头部 */}
      <div className="relative overflow-hidden">
        {/* 传统红色渐变背景 */}
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

        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            {/* 传统印章风格标识 */}
            <div className="inline-flex items-center justify-center w-20 h-20 mb-8 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="text-center">
                <span className="text-2xl font-black">联</span>
                <div className="w-4 h-0.5 bg-yellow-400 mx-auto mt-1"></div>
              </div>
            </div>

            <h1 className="text-4xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-wide">
              <span className="block bg-gradient-to-r from-red-600 via-orange-600 to-red-700 bg-clip-text text-transparent mb-2 drop-shadow-sm">
                {t('exploreTitle')}
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
              {t('exploreDesc')}
            </p>

            {/* 搜索框 - 传统风格 */}
            <div className="max-w-2xl mx-auto">
              <div className="relative bg-gradient-to-br from-red-50/90 to-orange-50/90 dark:from-gray-800/90 dark:to-red-900/30 rounded-3xl shadow-2xl border-2 border-red-200/50 dark:border-red-800/50 p-6 focus-within:border-red-400 dark:focus-within:border-red-600 transition-all duration-300">
                {/* 传统装饰元素 */}
                <div className="absolute top-4 left-4 w-6 h-6 opacity-20">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
                    <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="4"/>
                    <path d="M35 50 Q50 35, 65 50 Q50 65, 35 50" fill="currentColor"/>
                  </svg>
                </div>
                <div className="absolute top-4 right-4 w-6 h-6 opacity-20">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-orange-600">
                    <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="4"/>
                    <circle cx="50" cy="50" r="10" fill="currentColor"/>
                  </svg>
                </div>
                
                <SmartSearch
                  onSearch={handleSearch}
                  onResultSelect={handleResultSelect}
                  placeholder={t('searchPlaceholder')}
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
            <div className="bg-gradient-to-br from-white/95 to-red-50/80 dark:from-gray-800/95 dark:to-red-900/30 rounded-3xl p-6 shadow-xl border-2 border-red-100/50 dark:border-red-800/50 mb-6 backdrop-blur-sm">
              {/* 传统装饰 */}
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-xl flex items-center justify-center mr-3 shadow-lg">
                  <span className="text-sm font-black">类</span>
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">{t('categoryFilter')}</h3>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {categories.length <= 1 ? (
                  <div className="text-gray-400 text-sm text-center py-4">{t('noCategory')}</div>
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
                          ? 'bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/40 dark:to-orange-900/40 text-red-800 dark:text-red-200 shadow-lg border-2 border-red-200 dark:border-red-700'
                          : 'hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-red-900/20 dark:hover:to-orange-900/20 text-gray-700 dark:text-gray-300 border-2 border-transparent'
                      }`}
                    >
                      <span className="font-medium">{category.name}</span>
                      {category.count !== undefined && (
                        <span className="text-xs bg-gradient-to-r from-red-600 to-orange-600 text-white px-3 py-1 rounded-full font-bold shadow-sm">
                          {category.count}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* 热门标签 */}
            <div className="bg-gradient-to-br from-white/95 to-orange-50/80 dark:from-gray-800/95 dark:to-orange-900/30 rounded-3xl p-6 shadow-xl border-2 border-orange-100/50 dark:border-orange-800/50 backdrop-blur-sm">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-red-600 text-white rounded-xl flex items-center justify-center mr-3 shadow-lg">
                  <span className="text-sm font-black">标</span>
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{t('hotTags')}</h3>
              </div>
              <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto pr-2">
                {tags.length === 0 ? (
                  <div className="text-gray-400 text-sm text-center py-4 w-full">{t('noTag')}</div>
                ) : (
                  tags.map((tag) => (
                    <span
                      key={tag.id || tag.slug}
                      className="px-3 py-2 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40 text-orange-700 dark:text-orange-300 rounded-full text-sm hover:from-orange-200 hover:to-red-200 dark:hover:from-orange-800/60 dark:hover:to-red-800/60 transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-sm border border-orange-200 dark:border-orange-800 font-medium"
                    >
                      #{tag.name}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 右侧对联列表 */}
          <div className="lg:col-span-3">
            {/* 排序和筛选 */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-lg flex items-center justify-center mr-2 shadow-sm">
                    <span className="text-xs font-black">总</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 font-medium">{t('totalCouplets', { count: couplets.length })}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => { setSort('latest'); setPage(1) }} className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${sort === 'latest' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg' : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 text-red-700 dark:text-red-300 hover:from-red-100 hover:to-orange-100 dark:hover:from-red-800/40 dark:hover:to-orange-800/40 border border-red-200 dark:border-red-800'}`}>{t('sortLatest')}</button>
                  <button onClick={() => { setSort('hot'); setPage(1) }} className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${sort === 'hot' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg' : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 text-red-700 dark:text-red-300 hover:from-red-100 hover:to-orange-100 dark:hover:from-red-800/40 dark:hover:to-orange-800/40 border border-red-200 dark:border-red-800'}`}>{t('sortHot')}</button>
                  <button onClick={() => { setSort('contents'); setPage(1) }} className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${sort === 'contents' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg' : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 text-red-700 dark:text-red-300 hover:from-red-100 hover:to-orange-100 dark:hover:from-red-800/40 dark:hover:to-orange-800/40 border border-red-200 dark:border-red-800'}`}>{t('sortContents')}</button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className={`p-3 rounded-2xl transition-all duration-300 transform hover:scale-105 ${viewMode === 'list' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg' : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'}`}
                  onClick={() => setViewMode('list')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  className={`p-3 rounded-2xl transition-all duration-300 transform hover:scale-105 ${viewMode === 'grid' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg' : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'}`}
                  onClick={() => setViewMode('grid')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 对联网格/列表 */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {loading ? (
                  <div className="col-span-full text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl mb-4 animate-pulse">
                      <span className="text-2xl font-black">联</span>
                    </div>
                    <div className="text-gray-400">{t('loading')}</div>
                  </div>
                ) : couplets.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="text-6xl mb-4">🎋</div>
                    <div className="text-gray-400">{t('notFound')}</div>
                  </div>
                ) : (
                  couplets.map((couplet, index) => {
                    // 获取第一个对联内容用于展示
                    const firstContent = couplet.contents?.[0]
                    const topLine = firstContent?.upperLine || t('noUpperLine')
                    const bottomLine = firstContent?.lowerLine || t('noLowerLine')
                    const horizontal = firstContent?.horizontalScroll || t('noHorizontalScroll')
                    
                    return (
                      <div
                        key={couplet.id}
                        onClick={() => {
                          // 打开广告页面到新窗口
                          // window.open('https://otieu.com/4/10006059', '_blank', 'noopener,noreferrer')
                          // 跳转到对联详情页
                          router.push(`/couplet/${couplet.category?.slug}/${encodeURIComponent(couplet.title)}/${couplet.id}`)
                        }}
                        className="group relative bg-gradient-to-br from-white/95 to-red-50/80 dark:from-gray-800/95 dark:to-red-900/30 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 p-6 border-2 border-red-100/50 dark:border-red-800/50 hover:border-red-300 dark:hover:border-red-600 overflow-hidden cursor-pointer backdrop-blur-sm"
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
                            {couplet.category?.name || t('uncategorized')}
                          </div>
                          <div className="relative w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl flex items-center justify-center text-sm font-black shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
                            <span>联</span>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
                          </div>
                        </div>

                        {/* 标题 */}
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300 tracking-wide">
                          {couplet.title}
                        </h3>

                        {/* 对联展示区 - 和首页一样的风格 */}
                        <div className="relative mb-6">
                          <div className="p-4 relative">
                            
                            {/* 横批 */}
                            <div className="text-center mb-4">
                              <div className="inline-block relative">
                                <div className="bg-gradient-to-r from-red-600 to-red-700 border-2 border-yellow-400 rounded-xl px-6 py-3 shadow-lg">
                                  <span className="text-yellow-300 font-black text-sm tracking-wider">
                                    {horizontal}
                                  </span>
                                </div>
                                {/* 传统印章装饰 */}
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border border-red-600">
                                  <span className="text-red-800 text-xs font-bold">印</span>
                                </div>
                              </div>
                            </div>

                            {/* 对联主体 */}
                            <div className="flex justify-between items-start gap-4">
                              {/* 上联 */}
                              <div className="flex-1 relative">
                                <div className="bg-gradient-to-b from-red-600 to-red-700 border-2 border-yellow-400 rounded-xl p-3 min-h-[140px] flex flex-col justify-center items-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-800 text-xs px-2 py-1 rounded-full font-black shadow-md">
                                    {t('upperLineLabel')}
                                  </div>
                                  <div className="flex flex-col items-center">
                                    {topLine.split('').map((char: string, i: number) => (
                                      <span 
                                        key={i} 
                                        className="text-yellow-300 font-black text-base mb-1 block hover:text-yellow-200 transition-colors duration-200"
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
                                <div className="bg-gradient-to-b from-red-600 to-red-700 border-2 border-yellow-400 rounded-xl p-3 min-h-[140px] flex flex-col justify-center items-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-800 text-xs px-2 py-1 rounded-full font-black shadow-md">
                                    {t('lowerLineLabel')}
                                  </div>
                                  <div className="flex flex-col items-center">
                                    {bottomLine.split('').map((char: string, i: number) => (
                                      <span 
                                        key={i} 
                                        className="text-yellow-300 font-black text-base mb-1 block hover:text-yellow-200 transition-colors duration-200"
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

                        {/* 统计信息 */}
                        <div className="flex items-center justify-end gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
                            <svg className="w-3 h-3 mr-1 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {formatNumber(couplet.viewCount)}
                          </span>
                          <span className="flex items-center bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg">
                            <svg className="w-3 h-3 mr-1 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {formatNumber(couplet.likeCount)}
                          </span>
                        </div>

                        {/* 底部信息 */}
                        <div className="mt-4 pt-4 border-t border-red-100 dark:border-red-800/50">
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span className="hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 font-medium">
                              {couplet.author || t('unknown')}
                            </span>
                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                              {formatDate(couplet.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* 悬停光效 */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-100/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-3xl pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />
                      </div>
                    )
                  })
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl mb-4 animate-pulse">
                      <span className="text-2xl font-black">联</span>
                    </div>
                    <div className="text-gray-400">{t('loading')}</div>
                  </div>
                ) : couplets.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎋</div>
                    <div className="text-gray-400">{t('notFound')}</div>
                  </div>
                ) : (
                  couplets.map((couplet) => {
                    // 获取第一个对联内容用于展示
                    const firstContent = couplet.contents?.[0]
                    const topLine = firstContent?.upperLine || t('noUpperLine')
                    const bottomLine = firstContent?.lowerLine || t('noLowerLine')
                    const horizontal = firstContent?.horizontalScroll || t('noHorizontalScroll')
                    
                    return (
                      <div
                        key={couplet.id}
                        onClick={() => {
                          // 打开广告页面到新窗口
                          // window.open('https://otieu.com/4/10006059', '_blank', 'noopener,noreferrer')
                          // 跳转到对联详情页
                          router.push(`/couplet/${couplet.category?.slug}/${encodeURIComponent(couplet.title)}/${couplet.id}`)
                        }}
                        className="group flex bg-gradient-to-br from-white/95 to-red-50/80 dark:from-gray-800/95 dark:to-red-900/30 rounded-3xl shadow-xl border-2 border-red-100/50 dark:border-red-800/50 p-6 hover:shadow-2xl hover:border-red-300 dark:hover:border-red-600 transition-all duration-300 cursor-pointer backdrop-blur-sm transform hover:-translate-y-1"
                      >
                        {/* 左侧对联展示区 */}
                        <div className="flex-shrink-0 w-80 mr-6">
                          {/* 标题 */}
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300 tracking-wide">
                            {couplet.title}
                          </h3>
                          
                          {/* 对联内容 - 紧凑版 */}
                          <div className="relative">
                            {/* 横批 */}
                            <div className="text-center mb-3">
                              <div className="inline-block relative">
                                <div className="bg-gradient-to-r from-red-600 to-red-700 border border-yellow-400 rounded-lg px-4 py-2 shadow-md">
                                  <span className="text-yellow-300 font-bold text-xs tracking-wider">
                                    {horizontal}
                                  </span>
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                  <span className="text-red-800 text-xs font-bold">印</span>
                                </div>
                              </div>
                            </div>

                            {/* 对联主体 - 水平排列 */}
                            <div className="flex justify-between items-center gap-3">
                              {/* 上联 */}
                              <div className="flex-1">
                                <div className="bg-gradient-to-r from-red-600 to-red-700 border border-yellow-400 rounded-lg p-2 shadow-md">
                                  <div className="text-center mb-1">
                                    <span className="bg-yellow-400 text-red-800 text-xs px-2 py-0.5 rounded-full font-bold">{t('upperLineLabel')}</span>
                                  </div>
                                  <div className="text-yellow-300 font-bold text-sm text-center tracking-wide">
                                    {topLine}
                                  </div>
                                </div>
                              </div>

                              {/* 下联 */}
                              <div className="flex-1">
                                <div className="bg-gradient-to-r from-red-600 to-red-700 border border-yellow-400 rounded-lg p-2 shadow-md">
                                  <div className="text-center mb-1">
                                    <span className="bg-yellow-400 text-red-800 text-xs px-2 py-0.5 rounded-full font-bold">{t('lowerLineLabel')}</span>
                                  </div>
                                  <div className="text-yellow-300 font-bold text-sm text-center tracking-wide">
                                    {bottomLine}
                                  </div>
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
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/40 dark:to-orange-900/40 text-red-700 dark:text-red-300 text-xs font-bold border border-red-200 dark:border-red-800">
                                  {couplet.category?.name || t('uncategorized')}
                                </span>
                              </div>
                              <div className="relative w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-xl flex items-center justify-center text-xs font-black shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
                                <span>联</span>
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
                              </div>
                            </div>
                            
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-3 line-clamp-2">
                              {couplet.description}
                            </p>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              {(couplet.tags || []).slice(0, 4).map((tag) => (
                                <span key={tag} className="px-2 py-1 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium border border-orange-200 dark:border-orange-800">
                                  #{tag}
                                </span>
                              ))}
                              {(couplet.tags || []).length > 4 && (
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-xs">
                                  +{(couplet.tags || []).length - 4}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
                                <svg className="w-3 h-3 mr-1 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {formatNumber(couplet.viewCount)}
                              </span>
                              <span className="flex items-center bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg">
                                <svg className="w-3 h-3 mr-1 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                {formatNumber(couplet.likeCount)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 font-medium">
                                {couplet.author || t('unknown')}
                              </span>
                              <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                                {formatDate(couplet.createdAt)}
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

            {/* 分页 - 传统风格 */}
            <div className="flex items-center justify-center mt-16">
              <nav className="flex items-center space-x-3">
                <button 
                  onClick={() => setPage(page - 1)} 
                  disabled={page === 1} 
                  className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 text-red-600 dark:text-red-400 hover:from-red-100 hover:to-orange-100 dark:hover:from-red-800/40 dark:hover:to-orange-800/40 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl border-2 border-red-200 dark:border-red-800 transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-lg"
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
                          ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white border-2 border-red-700' 
                          : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 text-red-700 dark:text-red-300 hover:from-red-100 hover:to-orange-100 dark:hover:from-red-800/40 dark:hover:to-orange-800/40 border-2 border-red-200 dark:border-red-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button 
                  onClick={() => setPage(page + 1)} 
                  disabled={page === totalPages} 
                  className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 text-red-600 dark:text-red-400 hover:from-red-100 hover:to-orange-100 dark:hover:from-red-800/40 dark:hover:to-orange-800/40 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl border-2 border-red-200 dark:border-red-800 transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-lg"
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