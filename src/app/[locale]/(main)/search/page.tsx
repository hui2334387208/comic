'use client'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { useTranslations } from 'next-intl'

const mockSearchResults = [
  {
    id: 1,
    title: '新春佳节对联',
    top: '春风得意花千树',
    bottom: '鸿运当头福万家',
    horizontal: '福满人间',
    category: '节庆',
    tags: ['新春', '春节', '祝福'],
    viewCount: 1250,
    likeCount: 89,
  },
  {
    id: 2,
    title: '开业喜庆对联',
    top: '广聚八方客',
    bottom: '财开四海门',
    horizontal: '生意兴隆',
    category: '商务',
    tags: ['开业', '商业', '财运'],
    viewCount: 2100,
    likeCount: 156,
  },
  {
    id: 3,
    title: '婚礼贺联',
    top: '佳偶天成花并蒂',
    bottom: '良缘永结月同圆',
    horizontal: '百年好合',
    category: '喜宴',
    tags: ['婚礼', '结婚', '祝福'],
    viewCount: 1800,
    likeCount: 134,
  },
]

export default function SearchResultsPage() {
  const t = useTranslations('main.search')
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [results] = useState(mockSearchResults)
  const [filters, setFilters] = useState({
    category: 'all',
    sort: 'relevance',
  })

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }))
  }

  const filterOptions = {
    category: [
      { value: 'all', label: t('filters.category.all') },
      { value: '节庆', label: t('filters.category.festival') },
      { value: '商务', label: t('filters.category.business') },
      { value: '喜宴', label: t('filters.category.wedding') },
      { value: '校园', label: t('filters.category.school') },
    ],
    sort: [
      { value: 'relevance', label: t('filters.sort.relevance') },
      { value: 'latest', label: t('filters.sort.latest') },
      { value: 'popular', label: t('filters.sort.popular') },
      { value: 'views', label: t('filters.sort.views') },
    ],
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />

        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              {t('title')}
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              {t('foundResults', { count: results.length })}
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('placeholder')}
              className="w-full px-6 py-4 rounded-xl bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('filters.title')}</h3>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('filters.category.title')}</h4>
                <div className="space-y-2">
                  {filterOptions.category.map(option => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value={option.value}
                        checked={filters.category === option.value}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('filters.sort.title')}</h4>
                <div className="space-y-2">
                  {filterOptions.sort.map(option => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="sort"
                        value={option.value}
                        checked={filters.sort === option.value}
                        onChange={(e) => handleFilterChange('sort', e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                {t('foundResults', { count: results.length })}
              </p>
            </div>

            <div className="space-y-6">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{result.title}</h3>
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {result.category}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="rounded-xl bg-gradient-to-b from-red-500 via-red-600 to-red-700 text-white p-4">
                        <div className="text-sm opacity-80 mb-2">{t('couplet.top')}</div>
                        <div className="text-lg font-semibold">{result.top}</div>
                      </div>
                      <div className="rounded-xl bg-gradient-to-b from-red-500 via-red-600 to-red-700 text-white p-4">
                        <div className="text-sm opacity-80 mb-2">{t('couplet.bottom')}</div>
                        <div className="text-lg font-semibold">{result.bottom}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-xl p-3 mb-4">
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('couplet.horizontal')}</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{result.horizontal}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {result.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{t('stats.views', { count: result.viewCount })}</span>
                      <span>{t('stats.likes', { count: result.likeCount })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
