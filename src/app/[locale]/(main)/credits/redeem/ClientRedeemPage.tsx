'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface RedeemRecord {
  id: string
  code: string
  credits: number
  redeemedAt: string
}

export default function ClientRedeemPage() {
  const { status } = useSession()
  const router = useRouter()
  const [code, setCode] = useState('')
  const [balance, setBalance] = useState(0)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [records, setRecords] = useState<RedeemRecord[]>([])
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchBalance()
      fetchRecords()
    }
  }, [status])

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/credits/balance')
      if (res.ok) {
        const data = await res.json()
        setBalance(data.data.balance)
      }
    } catch (error) {
      console.error('获取余额失败:', error)
    }
  }

  const fetchRecords = async () => {
    setIsLoadingRecords(true)
    try {
      const res = await fetch('/api/credits/redeem/history')
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setRecords(data.data || [])
        }
      }
    } catch (error) {
      console.error('获取兑换记录失败:', error)
    } finally {
      setIsLoadingRecords(false)
    }
  }

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code.trim()) {
      setMessage({ type: 'error', text: '请输入兑换码' })
      return
    }

    setIsRedeeming(true)
    setMessage(null)

    try {
      const res = await fetch('/api/credits/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message })
        setCode('')
        fetchBalance()
        fetchRecords()
      } else {
        setMessage({ type: 'error', text: data.error || '兑换失败' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' })
    } finally {
      setIsRedeeming(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 余额卡片 */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-8 mb-8 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-2">当前余额</p>
              <p className="text-5xl font-bold">{balance}</p>
              <p className="text-purple-100 text-sm mt-2">次</p>
            </div>
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-5xl">💎</span>
            </div>
          </div>
        </div>

        {/* 兑换卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              兑换次数
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              输入兑换码充值生成次数
            </p>
          </div>

          <form onSubmit={handleRedeem} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                兑换码
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="请输入兑换码"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all text-center text-lg font-mono tracking-wider"
                disabled={isRedeeming}
              />
            </div>

            {message && (
              <div
                className={`p-4 rounded-xl ${
                  message.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-2 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-2 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {message.type === 'success' ? '✅' : '❌'}
                  </span>
                  <span className="font-medium">{message.text}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isRedeeming || !code.trim()}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isRedeeming ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  兑换中...
                </span>
              ) : (
                '立即兑换'
              )}
            </button>
          </form>

          {/* 说明 */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              使用说明
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                <span>1次 = 生成1张图片</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                <span>生成一个漫画通常需要10-30次</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                <span>兑换码不区分大小写</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                <span>每个兑换码只能使用一次</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                <span>次数永久有效，不会过期</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 兑换记录 */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 mt-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            兑换记录
          </h3>

          {isLoadingRecords ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">加载中...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📝</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">暂无兑换记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">💎</span>
                    </div>
                    <div>
                      <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                        {record.code}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {new Date(record.redeemedAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      +{record.credits}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">次</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
