'use client'

import React from 'react'

import { Link } from '@/i18n/navigation'

interface Benefit {
  category: string;
  icon: string;
  title: string;
  description: string;
  freeUser: string;
  vipUser: string;
  highlight?: boolean;
}

const benefits: Benefit[] = [
  {
    category: 'AI功能',
    icon: '🤖',
    title: 'AI时间线生成',
    description: '使用AI快速生成专业时间线',
    freeUser: '每日10次',
    vipUser: '每日100次',
    highlight: true,
  },
  {
    category: 'AI功能',
    icon: '🧠',
    title: '高级AI模型',
    description: '使用GPT-4等最新AI模型',
    freeUser: '基础模型',
    vipUser: 'GPT-4等高级模型',
    highlight: true,
  },
  {
    category: 'AI功能',
    icon: '🎯',
    title: '智能分析',
    description: 'AI智能分析历史事件关联',
    freeUser: '基础分析',
    vipUser: '深度智能分析',
    highlight: true,
  },
  {
    category: '模板资源',
    icon: '📋',
    title: '时间线模板',
    description: '丰富的专业时间线模板',
    freeUser: '基础模板',
    vipUser: '全部模板 + 专属模板',
    highlight: true,
  },
  {
    category: '模板资源',
    icon: '🎨',
    title: '自定义样式',
    description: '个性化时间线样式定制',
    freeUser: '基础样式',
    vipUser: '无限自定义样式',
    highlight: true,
  },
  {
    category: '模板资源',
    icon: '📊',
    title: '数据可视化',
    description: '高级图表和数据可视化',
    freeUser: '基础图表',
    vipUser: '专业可视化工具',
    highlight: true,
  },
  {
    category: '用户体验',
    icon: '🚫',
    title: '无广告体验',
    description: '纯净无广告的浏览体验',
    freeUser: '有广告',
    vipUser: '完全无广告',
    highlight: true,
  },
  {
    category: '用户体验',
    icon: '⚡',
    title: '优先功能体验',
    description: '新功能优先体验权',
    freeUser: '标准发布',
    vipUser: '优先体验',
    highlight: true,
  },
  {
    category: '用户体验',
    icon: '📱',
    title: '多设备同步',
    description: '跨设备数据同步',
    freeUser: '基础同步',
    vipUser: '实时同步 + 离线访问',
    highlight: true,
  },
  {
    category: '客户支持',
    icon: '🎧',
    title: '专属客服',
    description: '24小时专属客服支持',
    freeUser: '邮件支持',
    vipUser: '24小时专属客服',
    highlight: true,
  },
  {
    category: '客户支持',
    icon: '📞',
    title: '优先响应',
    description: '问题优先处理和响应',
    freeUser: '标准响应',
    vipUser: '优先响应',
    highlight: true,
  },
  {
    category: '客户支持',
    icon: '💬',
    title: '一对一指导',
    description: '专业使用指导服务',
    freeUser: '自助服务',
    vipUser: '一对一专业指导',
    highlight: true,
  },
  {
    category: '数据分析',
    icon: '📈',
    title: '使用统计',
    description: '详细的使用数据分析',
    freeUser: '基础统计',
    vipUser: '详细分析报告',
    highlight: true,
  },
  {
    category: '数据分析',
    icon: '📊',
    title: '趋势分析',
    description: 'AI使用趋势和优化建议',
    freeUser: '无',
    vipUser: '智能趋势分析',
    highlight: true,
  },
  {
    category: '数据分析',
    icon: '🎯',
    title: '个性化推荐',
    description: '基于使用习惯的个性化推荐',
    freeUser: '通用推荐',
    vipUser: '智能个性化推荐',
    highlight: true,
  },
  {
    category: '专属服务',
    icon: '🎁',
    title: 'VIP活动',
    description: '专属VIP活动和福利',
    freeUser: '无',
    vipUser: '免费参加VIP活动',
    highlight: true,
  },
  {
    category: '专属服务',
    icon: '🎨',
    title: '定制服务',
    description: '个性化定制服务',
    freeUser: '无',
    vipUser: '专属定制服务',
    highlight: true,
  },
  {
    category: '专属服务',
    icon: '🏆',
    title: '专属标识',
    description: 'VIP专属身份标识',
    freeUser: '无',
    vipUser: '专属VIP标识',
    highlight: true,
  },
]

const categories = ['AI功能', '模板资源', '用户体验', '客户支持', '数据分析', '专属服务']

export default function VipBenefitsPage() {
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
              👑 VIP会员权益
            </span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            VIP会员专属权益
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            解锁全部高级功能，享受专属服务，让您的创作更加高效
          </p>
        </div>

        {/* 权益概览 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            权益概览
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 border border-gray-200 dark:border-gray-700 rounded-xl">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI功能增强</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">10倍AI生成次数，高级模型支持</p>
            </div>
            <div className="text-center p-6 border border-gray-200 dark:border-gray-700 rounded-xl">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">模板资源</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">全部模板 + 专属模板</p>
            </div>
            <div className="text-center p-6 border border-gray-200 dark:border-gray-700 rounded-xl">
              <div className="text-4xl mb-4">🎧</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">专属客服</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">24小时专属客服支持</p>
            </div>
            <div className="text-center p-6 border border-gray-200 dark:border-gray-700 rounded-xl">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">专属服务</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">VIP活动 + 定制服务</p>
            </div>
          </div>
        </div>

        {/* 详细权益对比 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            详细权益对比
          </h2>

          {categories.map((category) => (
            <div key={category} className="mb-12">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <span className="mr-3">
                  {category === 'AI功能' && '🤖'}
                  {category === '模板资源' && '📋'}
                  {category === '用户体验' && '⚡'}
                  {category === '客户支持' && '🎧'}
                  {category === '数据分析' && '📊'}
                  {category === '专属服务' && '🎁'}
                </span>
                {category}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {benefits
                  .filter(benefit => benefit.category === category)
                  .map((benefit, index) => (
                    <div
                      key={index}
                      className={`p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-all duration-200 ${
                        benefit.highlight ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="text-3xl flex-shrink-0">{benefit.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                            {benefit.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {benefit.description}
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="font-medium text-gray-500 dark:text-gray-400 mb-1">免费用户</div>
                              <div className="text-gray-700 dark:text-gray-300">{benefit.freeUser}</div>
                            </div>
                            <div>
                              <div className="font-medium text-blue-600 dark:text-blue-400 mb-1">VIP用户</div>
                              <div className="text-blue-700 dark:text-blue-300 font-medium">{benefit.vipUser}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* 升级提示 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">准备升级为VIP会员？</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            立即享受所有VIP专属权益，提升您的创作效率和体验
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/vip/plans"
              className="px-8 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-gray-100 transition-colors duration-200"
            >
              查看会员计划
            </Link>
            <Link
              href="/vip/redeem"
              className="px-8 py-3 border border-white text-white rounded-xl font-medium hover:bg-white hover:text-blue-600 transition-colors duration-200"
            >
              兑换会员码
            </Link>
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
            <span>返回VIP中心</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
