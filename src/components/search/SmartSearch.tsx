'use client'
import { debounce } from 'lodash'
import React, { useState, useEffect, useRef } from 'react'

export interface SearchResult {
  id: number;
  title: string;
  description: string;
  type: 'comic' | 'version' | 'author';
  relevance: number;
  url: string;
}

export interface SmartSearchProps {
  onSearch: (query: string) => void;
  onResultSelect: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

const SmartSearch: React.FC<SmartSearchProps> = ({
  onSearch,
  onResultSelect,
  placeholder = '搜索时间线、事件或人物...',
  className = '',
}) => {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const [suggestions, setSuggestions] = useState<{id:number;title:string;description:string}[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleInputFocus = () => {
    setIsFocused(true)
  }

  const handleInputBlur = () => {
    setIsFocused(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query.trim())
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'comic':
        return '📚'
      case 'version':
        return '📝'
      case 'author':
        return '👤'
      default:
        return '📄'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'comic':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'version':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'author':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  // 实时请求真实建议
  const fetchSuggestions = debounce(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch(`/api/comic/suggest?query=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSuggestions(data)
      setShowSuggestions(true)
    } finally {
      setIsLoading(false)
    }
  }, 300)

  useEffect(() => {
    fetchSuggestions(query)
    return () => { fetchSuggestions.cancel && fetchSuggestions.cancel() }
  }, [query])

  const handleSuggestionClick = (item: {id:number;title:string;description:string}) => {
    setQuery(item.title)
    setShowSuggestions(false)
    onSearch(item.title)
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSearch}>
        <div className="relative">
          {/* 搜索输入框 */}
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className={`w-full px-4 py-3 pl-12 pr-12 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 text-gray-900 dark:text-white ${
              isFocused
                ? 'border-purple-400 dark:border-purple-600 bg-white/95 dark:bg-gray-700/95 shadow-xl focus:ring-purple-400/30 dark:focus:ring-purple-600/30'
                : 'border-purple-200 dark:border-purple-800 bg-white/90 dark:bg-gray-800/90 shadow-lg'
            }`}
          />

          {/* 搜索图标 */}
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* 搜索按钮 */}
          <button
            type="submit"
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
          >
            <div className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
              搜索
            </div>
          </button>
        </div>
      </form>
      {/* 搜索建议 */}
      {isFocused && showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-br from-white/95 to-purple-50/80 dark:from-gray-800/95 dark:to-purple-900/30 rounded-2xl shadow-2xl border-2 border-purple-200/50 dark:border-purple-800/50 z-[9999] max-h-96 overflow-y-auto backdrop-blur-sm">
          {isLoading ? (
            <div className="p-6 text-center text-purple-600 dark:text-purple-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto" />
              <p className="mt-3 text-sm font-medium">搜索中...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSuggestionClick(item)}
                  className="mx-2 px-4 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 cursor-pointer transition-all duration-300 rounded-xl border border-transparent hover:border-purple-200 dark:hover:border-purple-800 transform hover:scale-105"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate text-left hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query.length > 0 ? (
            <div className="p-6 text-center text-purple-500 dark:text-purple-400">
              <div className="text-2xl mb-2">🎨</div>
              <p className="text-sm font-medium">未找到相关漫画</p>
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">尝试使用不同的关键词</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default SmartSearch
