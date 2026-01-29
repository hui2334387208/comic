'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'

interface ChainInfo {
  id: number
  title: string
  startLine: string
  startLineType: string
  theme: string
  status: string
}

interface Props {
  chainId: string
}

const ClientAddChainEntryPage: React.FC<Props> = ({ chainId }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const [chain, setChain] = useState<ChainInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    fetchChainInfo()
  }, [chainId])

  const fetchChainInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/social/chains/${chainId}`)
      const data = await response.json()
      
      if (data.success) {
        setChain(data.data)
      } else {
        setError(data.message || '获取接龙信息失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.id) {
      router.push('/sign-in')
      return
    }

    if (!content.trim()) {
      alert('请输入接龙内容')
      return
    }

    try {
      setSubmitting(true)
      
      const response = await fetch(`/api/social/chains/${chainId}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          contentType: chain?.startLineType === 'upper' ? 'lower_line' : 'upper_line',
          userId: session.user.id
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/social/chains/${chainId}`)
      } else {
        alert(data.message || '提交失败')
      }
    } catch (error) {
      console.error('提交接龙失败:', error)
      alert('提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
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

  if (chain.status !== 'active') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <div className="text-red-600 text-xl font-bold mb-4">该接龙已结束</div>
          <Link 
            href={`/social/chains/${chainId}`}
            className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700"
          >
            查看接龙详情
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-red-700 mb-4">参与接龙</h1>
            <p className="text-red-600 text-lg">{chain.title}</p>
          </div>

          {/* 接龙信息 */}
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8 mb-8">
            <h2 className="text-xl font-black text-red-700 mb-4">接龙信息</h2>
            
            {/* 起始句展示 */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
              <div className="text-center">
                <div className="text-red-600 font-bold mb-2">
                  {chain.startLineType === 'upper' ? '上联' : '下联'}
                </div>
                <div className="text-red-800 font-black text-2xl py-2">
                  {chain.startLine}
                </div>
              </div>
            </div>

            {/* 提示信息 */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💡</span>
                <span className="font-bold text-yellow-700">接龙提示</span>
              </div>
              <div className="text-yellow-800 text-sm space-y-1">
                <p>• 请对出工整的{chain.startLineType === 'upper' ? '下联' : '上联'}</p>
                <p>• 注意平仄对仗，词性相对</p>
                <p>• 内容积极向上，符合主题：{chain.theme || '无特定主题'}</p>
                <p>• 字数应与起始句保持一致</p>
              </div>
            </div>

            {/* 输入表单 */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-red-700 font-bold mb-2">
                  你的{chain.startLineType === 'upper' ? '下联' : '上联'} *
                </label>
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none text-center text-xl font-bold"
                  placeholder={`请输入你的${chain.startLineType === 'upper' ? '下联' : '上联'}`}
                  required
                />
                <div className="text-sm text-gray-600 mt-2 text-center">
                  字数：{content.length} / 建议与起始句字数一致（{chain.startLine.length}字）
                </div>
              </div>

              {/* 对比展示 */}
              {content && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                  <div className="text-center space-y-4">
                    <div>
                      <div className="text-red-600 font-bold mb-1">
                        {chain.startLineType === 'upper' ? '上联' : '下联'}
                      </div>
                      <div className="text-red-800 font-black text-xl">
                        {chain.startLine}
                      </div>
                    </div>
                    <div>
                      <div className="text-red-600 font-bold mb-1">
                        {chain.startLineType === 'upper' ? '下联' : '上联'}
                      </div>
                      <div className="text-red-800 font-black text-xl">
                        {content}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 提交按钮 */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={submitting || !content.trim()}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '提交中...' : '提交接龙'}
                </button>
                <Link
                  href={`/social/chains/${chainId}`}
                  className="px-8 py-4 border-2 border-red-600 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all duration-300 text-center"
                >
                  取消
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientAddChainEntryPage