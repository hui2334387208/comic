'use client'

import { message, Spin } from 'antd'
import { useSession } from 'next-auth/react'
import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { Link, useRouter } from '@/i18n/navigation'


interface Feature {
  id: number;
  name: string;
  enabled: boolean;
  description: string | null;
}

interface Plan {
  id: number;
  name: string;
  description: string | null;
  duration: number;
  price: string;
  originalPrice: string | null;
  features: Feature[];
  sortOrder: number;
  popular?: boolean;
}

export default function ClientVipPlansPage() {
  const { data: session } = useSession()
  const t = useTranslations('main.vip.plansPage')
  const tFaqPage = useTranslations('main.vip.faqPage')
  const [plans, setPlans] = useState<Plan[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [purchaseLoading, setPurchaseLoading] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchPlans = async () => {
      setPageLoading(true)
      try {
        const response = await fetch('/api/vip/plans')
        if (!response.ok) {
          throw new Error('Failed to fetch plans')
        }
        const data = await response.json()
        const sortedPlans = data.sort((a: Plan, b: Plan) => a.sortOrder - b.sortOrder)
        if (sortedPlans.length > 1) {
          sortedPlans[1].popular = true
        }
        setPlans(sortedPlans)
      } catch (error) {
        console.error(error)
        message.error(t('loadError'))
      } finally {
        setPageLoading(false)
      }
    }
    fetchPlans()
  }, [])

  const handlePurchase = async (planId: number) => {
    if (!session?.user) {
      message.warning(t('loginRequired'))
      router.push('/sign-in')
      return
    }

    // alert('请联系客服')
    setPurchaseLoading(planId)
    try {
      const response = await fetch('/api/vip/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: session.user.id,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        router.push(`/vip/payment/${data.order.orderNo}`)
      } else {
        message.error(data.error || t('orderError'))
      }
    } catch (error) {
      console.error('购买失败:', error)
      message.error(t('purchaseError'))
    } finally {
      setPurchaseLoading(null)
    }
  }

  const getDurationText = (duration: number) => {
    if (duration === 1) return `1${t('month')}`
    if (duration === 12) return `12${t('months')}`
    return `${duration}${t('months')}`
  }

  const calculateDiscount = (price: string, originalPrice: string | null) => {
    if (!originalPrice) return null
    const priceNum = parseFloat(price)
    const originalPriceNum = parseFloat(originalPrice)
    if (originalPriceNum <= priceNum) return null
    return Math.round(((originalPriceNum - priceNum) / originalPriceNum) * 100)
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 dark:from-gray-900 dark:to-slate-900 flex justify-center items-center">
        <Spin size="large" tip={t('loading')} />
      </div>
    )
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
              💎 {t('title')}
            </span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            {t('pageTitle')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {t('pageDesc')}
          </p>
        </div>

        {/* 会员计划卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const discount = calculateDiscount(plan.price, plan.originalPrice)
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${plan.popular ? 'border-blue-500 dark:border-blue-400 shadow-blue-500/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  } ${plan.popular ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      {t('popular')}
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {getDurationText(plan.duration)}
                  </p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                      ¥{parseFloat(plan.price)}
                    </span>
                    {plan.originalPrice && (
                      <span className="text-lg text-gray-500 dark:text-gray-400 line-through ml-2">
                        ¥{parseFloat(plan.originalPrice)}
                      </span>
                    )}
                  </div>
                  {discount && (
                    <div className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                      {t('save')} {discount}%
                    </div>
                  )}
                </div>

                <div className="space-y-4 mb-8 flex-1">
                  {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                    <div key={feature.id || index} className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${feature.enabled ? 'bg-green-500' : 'bg-gray-400'}`}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          {feature.enabled
                            ? <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            : <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          }
                        </svg>
                      </div>
                      <span className={`text-gray-700 dark:text-gray-300 ${!feature.enabled ? 'line-through text-gray-500' : ''}`}>{feature.name}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePurchase(plan.id)}
                  disabled={purchaseLoading !== null}
                  className={`w-full py-4 px-6 rounded-xl font-medium transition-all duration-200 ${plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    } ${(purchaseLoading !== null) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {purchaseLoading === plan.id ? t('loading') : t('purchase')}
                </button>
              </div>
            )
          })}
        </div>

        {/* 常见问题 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {tFaqPage('plansFaq.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {tFaqPage('plansFaq.q1')}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {tFaqPage('plansFaq.a1')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {tFaqPage('plansFaq.q2')}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {tFaqPage('plansFaq.a2')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {tFaqPage('plansFaq.q3')}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {tFaqPage('plansFaq.a3')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {tFaqPage('plansFaq.q4')}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {tFaqPage('plansFaq.a4')}
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
