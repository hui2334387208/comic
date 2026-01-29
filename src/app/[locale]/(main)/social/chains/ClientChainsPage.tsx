'use client'

import React, { useState, useEffect } from 'react'
import { Link, useRouter } from '@/i18n/navigation'

interface Chain {
  id: number
  title: string
  description: string
  theme: string
  startLine: string
  startLineType: string
  status: string
  chainType: string
  maxEntries: number
  currentEntries: number
  creator: string
  lastEntry: {
    content: string
    user: string
    time: string
    likes: number
  } | null
  recentEntries: Array<{
    content: string
    user: string
    likes: number
  }>
}

const ClientChainsPage: React.FC = () => {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState('all')
  const [chains, setChains] = useState<Chain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchChains()
  }, [activeFilter])

  const fetchChains = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeFilter !== 'all') {
        params.append('status', activeFilter)
      }
      
      const response = await fetch(`/api/social/chains?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setChains(data.data.chains)
      } else {
        setError(data.message || '获取数据失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleParticipateChain = (chainId: number) => {
    // 跳转到接龙参与页面
    router.push(`/social/chains/add/${chainId}`)
  }

  const handleViewCompleteChain = (chainId: number) => {
    // 跳转到完整接龙查看页面
    router.push(`/social/chains/${chainId}`)
  }

  const handleViewChainDetails = (chainId: number) => {
    // 跳转到详情页面
    router.push(`/social/chains/${chainId}`)
  }

  const handleCreateChain = () => {
    // 跳转到创建接龙页面
    router.push('/social/chains/create')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600'
      case 'completed': return 'bg-blue-600'
      case 'closed': return 'bg-gray-600'
      default: return 'bg-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '进行中'
      case 'completed': return '已完成'
      case 'closed': return '已关闭'
      default: return '未知'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏮</div>
          <div className="text-red-600 text-xl font-bold">加载中...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <div className="text-red-600 text-xl font-bold mb-4">{error}</div>
          <button 
            onClick={fetchChains}
            className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 relative overflow-hidden">
      {/* 传统装饰背景 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-40 h-40 border-4 border-red-600 rounded-full"></div>
        <div className="absolute top-40 right-32 w-32 h-32 border-2 border-red-500 rotate-45"></div>
        <div className="absolute bottom-32 left-32 w-36 h-36 border-3 border-red-400 rounded-full"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h1 className="text-5xl font-black text-red-700 mb-4 relative">
              对联接龙
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full opacity-80 flex items-center justify-center text-white text-sm font-bold">🔗</div>
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
          </div>
          <p className="text-red-600 text-lg font-bold mt-6 max-w-2xl mx-auto">
            诗词接龙乐无穷，上联下联巧相连，妙趣横生展才华
          </p>
        </div>

        {/* 操作栏 */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          {/* 筛选按钮 */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: '全部接龙', icon: '📋' },
              { key: 'active', label: '进行中', icon: '🔥' },
              { key: 'completed', label: '已完成', icon: '✅' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 py-2 rounded-full font-bold transition-all duration-300 ${
                  activeFilter === filter.key
                    ? 'bg-red-600 text-white shadow-lg scale-105'
                    : 'bg-white text-red-600 border-2 border-red-600 hover:bg-red-50'
                }`}
              >
                <span className="mr-2">{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>

          {/* 开始接龙按钮 */}
          <button 
            onClick={handleCreateChain}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-full font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-red-500"
          >
            <span className="mr-2">🎭</span>
            开始接龙
          </button>
        </div>

        {/* 接龙列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {chains.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <div className="text-red-600 text-xl font-bold">暂无接龙</div>
              <div className="text-gray-600 mt-2">快来开始第一个对联接龙吧！</div>
            </div>
          ) : (
            chains.map(chain => (
              <div key={chain.id} className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 hover:border-red-400 transform hover:scale-105 transition-all duration-300 overflow-hidden">
                {/* 卡片头部 */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white relative">
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(chain.status)} text-white`}>
                      {getStatusText(chain.status)}
                    </span>
                  </div>
                  <h3 className="text-xl font-black mb-2 pr-20">{chain.title}</h3>
                  <p className="text-red-100 text-sm leading-relaxed">{chain.description}</p>
                </div>

                {/* 卡片内容 */}
                <div className="p-6 space-y-4">
                  {/* 起始句展示 */}
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🎯</span>
                      <span className="font-bold text-red-700">起始句</span>
                    </div>
                    <div className="text-red-800 font-black text-xl text-center py-2">
                      {chain.startLine}
                    </div>
                  </div>

                  {/* 接龙统计 */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="text-orange-600 font-bold mb-1">接龙数量</div>
                      <div className="text-orange-800 font-black text-lg">
                        {chain.currentEntries}/{chain.maxEntries}
                      </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="text-red-600 dark:text-red-400 font-bold mb-1">主题</div>
                      <div className="text-red-800 dark:text-red-200 font-black text-lg">{chain.theme || '无'}</div>
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold text-gray-600">
                      <span>接龙进度</span>
                      <span>{Math.round((chain.currentEntries / chain.maxEntries) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${(chain.currentEntries / chain.maxEntries) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 最新接龙 */}
                  {chain.lastEntry && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">✨</span>
                        <span className="font-bold text-yellow-700">最新接龙</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-yellow-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-gray-600">{chain.lastEntry.user}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{chain.lastEntry.time}</span>
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full flex items-center gap-1">
                              ❤️ {chain.lastEntry.likes}
                            </span>
                          </div>
                        </div>
                        <div className="text-red-700 font-black text-lg text-center">
                          {chain.lastEntry.content}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 热门接龙展示 */}
                  {chain.recentEntries && chain.recentEntries.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-bold text-gray-700 text-sm">热门接龙</div>
                      <div className="space-y-1">
                        {chain.recentEntries.slice(0, 3).map((entry, index) => (
                          <div key={index} className="bg-gray-50 p-2 rounded-lg flex justify-between items-center">
                            <div className="flex-1">
                              <div className="text-sm text-gray-800 font-medium">{entry.content}</div>
                              <div className="text-xs text-gray-500">{entry.user}</div>
                            </div>
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                              ❤️ {entry.likes}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex gap-3 pt-4">
                    {chain.status === 'active' && (
                      <button 
                        onClick={() => handleParticipateChain(chain.id)}
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300 border-2 border-yellow-400 shadow-lg hover:shadow-xl relative overflow-hidden"
                      >
                        {/* 传统装饰效果 */}
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative flex items-center justify-center gap-2">
                          <span className="text-lg">🎋</span>
                          参与接龙
                        </span>
                      </button>
                    )}
                    {chain.status === 'completed' && (
                      <button 
                        onClick={() => handleViewCompleteChain(chain.id)}
                        className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300 border-2 border-yellow-400 shadow-lg hover:shadow-xl relative overflow-hidden"
                      >
                        {/* 传统装饰效果 */}
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative flex items-center justify-center gap-2">
                          <span className="text-lg">📜</span>
                          查看完整
                        </span>
                      </button>
                    )}
                    <button 
                      onClick={() => handleViewChainDetails(chain.id)}
                      className="px-6 py-3 border-2 border-red-600 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all duration-300"
                    >
                      详情
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 返回按钮 */}
        <div className="text-center mt-12">
          <Link href="/social" className="inline-flex items-center gap-2 bg-white text-red-600 px-8 py-4 rounded-full font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-red-200 hover:border-red-400">
            <span>🏮</span>
            返回社交首页
            <span>🏮</span>
          </Link>
        </div>
      </div>

      {/* 浮动装饰元素 */}
      <div className="absolute top-1/4 left-8 w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
      <div className="absolute top-1/3 right-12 w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-1000"></div>
      <div className="absolute bottom-1/4 left-16 w-4 h-4 bg-red-600 rounded-full animate-bounce delay-2000"></div>
    </div>
  )
}

export default ClientChainsPage