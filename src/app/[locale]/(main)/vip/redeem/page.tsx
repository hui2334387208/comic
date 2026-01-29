'use client'

import { useSession } from 'next-auth/react'
import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

interface RedeemHistory {
  id: string;
  code: string;
  planName: string;
  duration: string;
  status: 'success' | 'failed' | 'expired';
  redeemedAt: string;
  message?: string;
}

export default function VipRedeemPage() {
  const { data: session } = useSession()
  const t = useTranslations('main.vip.redeemPage')
  const tFaqPage = useTranslations('main.vip.redeemPage')
  const [redeemCode, setRedeemCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [redeemHistory, setRedeemHistory] = useState<RedeemHistory[]>([])
  const [historyError, setHistoryError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchRedeemHistory()
    }
  }, [session])

  const fetchRedeemHistory = async () => {
    try {
      setHistoryError(null)
      const response = await fetch('/api/vip/redeem/history')
      if (response.ok) {
        const data = await response.json()
        setRedeemHistory(Array.isArray(data) ? data : data.data || [])
      } else {
        setRedeemHistory([])
        setHistoryError(t('historyError'))
      }
    } catch (error) {
      setRedeemHistory([])
      setHistoryError(t('historyError'))
    }
  }

  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      setMessage(t('enterCode'))
      setMessageType('error')
      return
    }

    if (!session?.user) {
      setMessage(t('loginRequired'))
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/vip/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: redeemCode.trim(),
          userId: session.user.id,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(t('redeemSuccess', { planName: data.planName, duration: data.duration }))
        setMessageType('success')
        setRedeemCode('')
        // 刷新兑换历史
        fetchRedeemHistory()
      } else {
        setMessage(data.message || t('error'))
        setMessageType('error')
      }
    } catch (error) {
      console.error('兑换失败:', error)
      setMessage(t('redeemFailed'))
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      success: { text: t('history.status.success'), color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      failed: { text: t('history.status.failed'), color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      expired: { text: t('history.status.expired'), color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
            <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
              🎁 {t('title')}
            </span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            {t('pageTitle')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {t('pageDesc')}
          </p>
        </div>

        {/* 兑换表单 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {t('formTitle')}
          </h2>

          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <label htmlFor="redeemCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('codeLabel')}
              </label>
              <input
                type="text"
                id="redeemCode"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value)}
                placeholder={t('codePlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                disabled={loading}
              />
            </div>

            {message && (
              <div className={`mb-6 p-4 rounded-xl ${
                messageType === 'success'
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}>
                {message}
              </div>
            )}

            <button
              onClick={handleRedeem}
              disabled={loading || !redeemCode.trim()}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('submitting') : t('submit')}
            </button>
          </div>
        </div>

        {/* 兑换说明 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {t('instructions.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{t('instructions.step1.title')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('instructions.step1.desc')}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{t('instructions.step2.title')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('instructions.step2.desc')}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{t('instructions.step3.title')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('instructions.step3.desc')}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{t('instructions.step4.title')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('instructions.step4.desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 兑换历史 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {t('history.title')}
          </h3>
          {historyError && (
            <div className="text-center text-red-500 mb-4">{historyError}</div>
          )}
          {redeemHistory.length === 0 && !historyError ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('history.noHistory')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {redeemHistory.map((record) => (
                <div
                  key={record.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {record.planName}
                        </h4>
                        {getStatusBadge(record.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">{t('history.table.code')}</span>
                          {record.code}
                        </div>
                        <div>
                          <span className="font-medium">{t('history.table.duration')}</span>
                          {record.duration}
                        </div>
                        <div>
                          <span className="font-medium">{t('history.table.redeemTime')}</span>
                          {formatDate(record.redeemedAt)}
                        </div>
                      </div>
                      {record.message && (
                        <div className="mt-3 text-sm text-red-600 dark:text-red-400">
                          {record.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 常见问题 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {tFaqPage('faq.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {tFaqPage('faq.q1')}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tFaqPage('faq.a1')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {tFaqPage('faq.q2')}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tFaqPage('faq.a2')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {tFaqPage('faq.q3')}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tFaqPage('faq.a3')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {tFaqPage('faq.q4')}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tFaqPage('faq.a4')}
              </p>
            </div>
          </div>
        </div>

        {/* 返回链接 */}
        <div className="text-center mt-8">
          <Link
            href="/vip"
            className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>{tFaqPage('backToVip')}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
