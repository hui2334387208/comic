'use client'
import { useSession } from 'next-auth/react'
import React, { useState, useEffect } from 'react'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import dayjs from 'dayjs'

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isVip: boolean;
  vipExpireDate?: string;
  aiUsageCount: number;
  aiDailyLimit: number;
  timelineCount: number;
  favoriteCount: number;
}

interface VipPlan {
  id: string;
  name: string;
  price: string;
  duration: number;
  status: boolean;
  sortOrder?: number;
  features?: { id: string; name: string; description?: string; enabled: boolean }[];
}

export default function ClientVipPage() {
  const { data: session } = useSession()
  const t = useTranslations('main.vip')
  const [userData, setUserData] = useState<UserData | null>(null)
  const [plans, setPlans] = useState<VipPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      Promise.all([
        fetch('/api/user/profile').then(res => res.ok ? res.json() : null),
        fetch('/api/vip/plans').then(res => res.ok ? res.json() : []),
      ]).then(([user, plans]) => {
        setUserData(user)
        setPlans(Array.isArray(plans) ? plans : [])
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [session])

  const isVip = userData?.isVip || false
  const vipExpireDate = userData?.vipExpireDate ? dayjs(userData.vipExpireDate) : null
  const isExpired = vipExpireDate && vipExpireDate.isBefore(dayjs())

  const vipBenefits = [
    {
      icon: '🚀',
      title: t('aiTimes'),
      description: t('aiTimesVip'),
      current: isVip ? t('aiTimesVip') : t('aiTimesFree'),
      upgrade: t('aiTimesVip'),
    },
    {
      icon: '⭐',
      title: t('advancedModel'),
      description: t('advancedModelVip'),
      current: isVip ? t('advancedModelVip') : t('advancedModelFree'),
      upgrade: t('advancedModelVip'),
    },
    {
      icon: '🎁',
      title: t('exclusiveTemplate'),
      description: t('exclusiveTemplateVip'),
      current: isVip ? t('exclusiveTemplateVip') : t('exclusiveTemplateFree'),
      upgrade: t('exclusiveTemplateVip'),
    },
    {
      icon: '👑',
      title: t('prioritySupport'),
      description: t('prioritySupportVip'),
      current: isVip ? t('prioritySupportVip') : t('prioritySupportFree'),
      upgrade: t('prioritySupportVip'),
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
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
              {isVip ? '🌟 ' + t('centerTitle') : '💎 ' + t('upgradeTitle')}
            </span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            {isVip ? t('centerTitle') : t('upgradeTitle')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {isVip ? t('centerDesc') : t('upgradeDesc')}
          </p>
        </div>

        {/* 会员状态卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="flex items-center space-x-6 mb-6 lg:mb-0">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl">
                {isVip ? '👑' : '💎'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {isVip ? t('statusVip') : t('statusFree')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {isVip
                    ? t('expireAt', { date: vipExpireDate ? vipExpireDate.format('YYYY-MM-DD') : '' })
                    : t('upgradeDesc')
                  }
                </p>
                {isVip && isExpired && (
                  <span className="inline-block mt-2 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm rounded-full">
                    {t('expired')}
                  </span>
                )}
              </div>
            </div>
            <Link
              href="/vip/plans"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
            >
              {isVip ? t('renewBtn') : t('upgradeBtn')}
            </Link>
          </div>
        </div>

        {/* 使用统计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {userData?.aiUsageCount || 0}
            </div>
            <div className="text-gray-600 dark:text-gray-400 mb-2">{t('aiUsageToday')}</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((userData?.aiUsageCount || 0) / (userData?.aiDailyLimit || 10)) * 100}%` }}
               />
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {userData?.aiUsageCount || 0} / {userData?.aiDailyLimit || 10}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {userData?.timelineCount || 0}
            </div>
            <div className="text-gray-600 dark:text-gray-400">{t('timelineCreated')}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {userData?.favoriteCount || 0}
            </div>
            <div className="text-gray-600 dark:text-gray-400">{t('timelineFavorited')}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
              {isVip ? t('levelVip') : t('levelFree')}
            </div>
            <div className="text-gray-600 dark:text-gray-400">{t('level')}</div>
          </div>
        </div>

        {/* 权益对比 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {t('benefitCompare')}
          </h3>
          {plans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-4">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-2 text-gray-700 dark:text-gray-300">{t('benefitCompare')}</th>
                    {plans.map(plan => (
                      <th key={plan.id} className="px-4 py-2 text-center text-blue-600 dark:text-blue-400 font-semibold">{plan.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* 动态渲染features，如果没有则降级为静态 */}
                  {plans[0]?.features && plans[0].features.length > 0 ? (
                    plans[0].features.map((feature, idx) => (
                      <tr key={feature.id}>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{feature.name}</td>
                        {plans.map(plan => (
                          <td key={plan.id} className="px-4 py-2 text-center">
                            {plan.features?.find(f => f.id === feature.id)?.enabled ? (
                              <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    // fallback: 静态权益
                    [
                      { name: t('aiTimes'), free: t('aiTimesFree'), vip: t('aiTimesVip') },
                      { name: t('advancedModel'), free: t('advancedModelFree'), vip: t('advancedModelVip') },
                      { name: t('exclusiveTemplate'), free: t('exclusiveTemplateFree'), vip: t('exclusiveTemplateVip') },
                      { name: t('prioritySupport'), free: t('prioritySupportFree'), vip: t('prioritySupportVip') },
                    ].map((item, idx) => (
                      <tr key={item.name}>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{item.name}</td>
                        <td className="px-4 py-2 text-center">{item.free}</td>
                        <td className="px-4 py-2 text-center">{item.vip}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">{t('noPlans')}</div>
          )}
        </div>

        {/* 快捷操作 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/vip/plans"
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 group"
          >
            <div className="text-center">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">👑</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('plans')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('plansDesc')}</p>
            </div>
          </Link>
          <Link
            href="/vip/orders"
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 group"
          >
            <div className="text-center">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('orders')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('ordersDesc')}</p>
            </div>
          </Link>
          <Link
            href="/vip/redeem"
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 group"
          >
            <div className="text-center">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">🎁</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('redeem')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('redeemDesc')}</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
