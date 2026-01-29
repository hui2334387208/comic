'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'

interface ChainEntry {
  id: number
  content: string
  contentType: string
  user: string
  likes: number
  createdAt: string
  isSelected: boolean
}

interface ChainDetail {
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
  entries: ChainEntry[]
}

interface Props {
  chainId: string
}

const ClientChainDetailPage: React.FC<Props> = ({ chainId }) => {
  const router = useRouter()
  const [chain, setChain] = useState<ChainDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchChainDetail()
  }, [chainId])

  const fetchChainDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/social/chains/${chainId}`)
      const data = await response.json()
      
      if (data.success) {
        setChain(data.data)
      } else {
        setError(data.message || '获取接龙详情失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleParticipate = () => {
    router.push(`/social/chains/add/${chainId}`)
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

  if (error || !chain) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <div className="text-red-600 text-xl font-bold mb-4">{error || '接龙不存在'}</div>
          <Link 
            href="/social/chains"
            className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700"
          >
            返回接龙列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50">
      <div className="container mx-auto px-4 py-12">
        {/* 接龙头部信息 */}
        <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white">
            <h1 className="text-4xl font-black mb-4">{chain.title}</h1>
            <p className="text-red-100 text-lg mb-4">{chain.description}</p>
            <div className="flex items-center gap-4">
              <span className="bg-red-500 px-4 py-2 rounded-full font-bold">
                {chain.status === 'active' ? '进行中' : chain.status === 'completed' ? '已完成' : '已关闭'}
              </span>
              <span className="text-red-200">创建者: {chain.creator}</span>
              <span className="text-red-200">主题: {chain.theme || '无'}</span>
            </div>
          </div>
          
          <div className="p-8">
            {/* 起始句 */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-black text-red-700 mb-4">起始句</h2>
              <div className="text-red-800 font-black text-2xl text-center py-4">
                {chain.startLine}
              </div>
              <div className="text-center text-red-600">
                ({chain.startLineType === 'upper' ? '上联' : '下联'})
              </div>
            </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-orange-600 font-bold mb-1">接龙数量</div>
                <div className="text-orange-800 font-black text-2xl">
                  {chain.currentEntries}/{chain.maxEntries}
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-red-600 font-bold mb-1">接龙类型</div>
                <div className="text-red-800 font-black text-lg">
                  {chain.chainType === 'continuous' ? '连续接龙' : '最佳匹配'}
                </div>
              </div>
            </div>

            {/* 参与按钮 */}
            {chain.status === 'active' && (
              <div className="text-center mb-8">
                <button
                  onClick={handleParticipate}
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-full font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  参与接龙
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 接龙条目列表 */}
        <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
          <h2 className="text-2xl font-black text-red-700 mb-6">接龙内容</h2>
          
          {chain.entries && chain.entries.length > 0 ? (
            <div className="space-y-4">
              {chain.entries.map((entry, index) => (
                <div key={entry.id} className={`p-4 rounded-lg border-2 ${entry.isSelected ? 'border-yellow-400 bg-yellow-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        #{index + 1}
                      </span>
                      <span className="font-bold text-gray-700">{entry.user}</span>
                      {entry.isSelected && (
                        <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          最佳
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>❤️ {entry.likes}</span>
                      <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-red-800 font-black text-xl text-center py-2">
                    {entry.content}
                  </div>
                  <div className="text-center text-red-600 text-sm">
                    ({entry.contentType === 'upper_line' ? '上联' : entry.contentType === 'lower_line' ? '下联' : '横批'})
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <div className="text-red-600 text-xl font-bold">暂无接龙内容</div>
              <div className="text-gray-600 mt-2">快来成为第一个参与者吧！</div>
            </div>
          )}
        </div>

        {/* 返回按钮 */}
        <div className="text-center mt-8">
          <Link
            href="/social/chains"
            className="inline-flex items-center gap-2 bg-white text-red-600 px-8 py-4 rounded-full font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-red-200 hover:border-red-400"
          >
            返回接龙列表
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ClientChainDetailPage