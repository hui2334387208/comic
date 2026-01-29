'use client'

import React, { useState } from 'react'

import { Link } from '@/i18n/navigation'

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: '什么是VIP会员？',
    answer: 'VIP会员是我们的高级会员服务，提供更多AI生成次数、高级AI模型、专属模板、无广告体验等专属权益，让您的创作更加高效。',
    category: '基础问题',
  },
  {
    id: '2',
    question: 'VIP会员有哪些权益？',
    answer: 'VIP会员权益包括：每日100次AI时间线生成、GPT-4等高级AI模型、VIP专属时间线模板、24小时专属客服支持、无广告浏览体验、优先功能体验等。',
    category: '基础问题',
  },
  {
    id: '3',
    question: '如何成为VIP会员？',
    answer: '您可以通过以下方式成为VIP会员：1. 直接购买会员计划；2. 使用VIP兑换码；3. 参与官方活动获得会员资格。',
    category: '购买相关',
  },
  {
    id: '4',
    question: 'VIP会员支持哪些支付方式？',
    answer: '我们支持微信支付、支付宝、银行卡等多种支付方式，安全便捷。所有支付都经过加密处理，确保您的资金安全。',
    category: '购买相关',
  },
  {
    id: '5',
    question: '会员可以随时取消吗？',
    answer: '是的，您可以随时取消会员订阅。已购买的会员时间将继续有效直到到期，不会因为取消订阅而提前失效。',
    category: '购买相关',
  },
  {
    id: '6',
    question: '会员到期后会自动续费吗？',
    answer: '不会自动续费。会员到期后，您需要手动续费才能继续享受VIP权益。我们会在到期前通过邮件提醒您。',
    category: '购买相关',
  },
  {
    id: '7',
    question: 'AI生成次数是如何计算的？',
    answer: 'AI生成次数按自然日计算，每天0点重置。VIP会员每日有100次AI生成机会，免费用户每日有10次。',
    category: '功能使用',
  },
  {
    id: '8',
    question: 'VIP专属模板在哪里？',
    answer: 'VIP专属模板在时间线创建页面中，会有专门的"VIP模板"分类。这些模板更加精美和专业，只有VIP会员可以使用。',
    category: '功能使用',
  },
  {
    id: '9',
    question: '如何联系VIP专属客服？',
    answer: 'VIP会员可以通过多种方式联系专属客服：1. 网站右下角的在线客服；2. 发送邮件到vip@timeline.com；3. 添加VIP客服微信。',
    category: '客服支持',
  },
  {
    id: '10',
    question: 'VIP客服的响应时间是多久？',
    answer: 'VIP会员享受24小时专属客服支持，工作日通常在30分钟内响应，非工作时间也会尽快回复。',
    category: '客服支持',
  },
  {
    id: '11',
    question: '可以转让VIP会员吗？',
    answer: 'VIP会员资格与账号绑定，不支持转让。但您可以将VIP兑换码赠送给朋友使用。',
    category: '账户管理',
  },
  {
    id: '12',
    question: 'VIP会员可以在多个设备上使用吗？',
    answer: '是的，VIP会员可以在多个设备上使用，支持电脑、手机、平板等设备。您的会员权益会在所有设备上同步。',
    category: '账户管理',
  },
  {
    id: '13',
    question: '如何查看我的会员状态？',
    answer: '您可以在VIP中心页面查看您的会员状态、到期时间、使用统计等信息。也可以在个人中心查看会员详情。',
    category: '账户管理',
  },
  {
    id: '14',
    question: 'VIP兑换码在哪里使用？',
    answer: '您可以在VIP中心的"兑换码"页面输入兑换码。兑换成功后，会员权益会立即生效。',
    category: '兑换相关',
  },
  {
    id: '15',
    question: '兑换码有使用期限吗？',
    answer: '是的，兑换码通常有使用期限，请在有效期内使用。过期后兑换码将失效，无法使用。',
    category: '兑换相关',
  },
  {
    id: '16',
    question: '可以重复使用同一个兑换码吗？',
    answer: '不可以，每个兑换码只能使用一次。使用后兑换码即失效，无法重复使用。',
    category: '兑换相关',
  },
  {
    id: '17',
    question: 'VIP会员权益会更新吗？',
    answer: '是的，我们会持续优化会员权益，新功能将优先向VIP会员开放。我们会通过邮件和网站公告通知您权益更新。',
    category: '权益更新',
  },
  {
    id: '18',
    question: '如何获得VIP兑换码？',
    answer: 'VIP兑换码可以通过以下方式获得：1. 官方活动赠送；2. 购买VIP会员时附赠；3. 朋友赠送；4. 参与社区活动获得。',
    category: '兑换相关',
  },
  {
    id: '19',
    question: 'VIP会员有发票吗？',
    answer: '是的，VIP会员购买后可以下载电子发票。您可以在订单页面找到"下载发票"按钮。',
    category: '购买相关',
  },
  {
    id: '20',
    question: '如何申请退款？',
    answer: '如果您对VIP会员服务不满意，可以在购买后7天内申请退款。请联系客服并提供订单信息。',
    category: '购买相关',
  },
]

const categories = ['基础问题', '购买相关', '功能使用', '客服支持', '账户管理', '兑换相关', '权益更新']

export default function VipFAQPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('全部')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const filteredFAQs = selectedCategory === '全部'
    ? faqData
    : faqData.filter(faq => faq.category === selectedCategory)

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
              ❓ 常见问题
            </span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            常见问题解答
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            关于VIP会员的常见问题，我们为您准备了详细的解答
          </p>
        </div>

        {/* 分类筛选 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            选择问题分类
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setSelectedCategory('全部')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                selectedCategory === '全部'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              全部问题
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {selectedCategory === '全部' ? '所有问题' : `${selectedCategory}相关`}
          </h2>

          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">❓</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                暂无相关问题
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                请选择其他分类或联系客服获取帮助
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFAQs.map((faq) => (
                <div
                  key={faq.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200"
                >
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm font-bold">Q</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {faq.question}
                        </h3>
                        <span className="text-sm text-blue-600 dark:text-blue-400">
                          {faq.category}
                        </span>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                        expandedItems.has(faq.id) ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {expandedItems.has(faq.id) && (
                    <div className="px-6 pb-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-start space-x-4 pt-4">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-sm font-bold">A</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 联系客服 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center mb-8">
          <h3 className="text-2xl font-bold mb-4">还有其他问题？</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            如果您的问题没有在这里找到答案，我们的VIP专属客服随时为您服务
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/support"
              className="px-8 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-gray-100 transition-colors duration-200"
            >
              联系客服
            </Link>
            <Link
              href="/vip"
              className="px-8 py-3 border border-white text-white rounded-xl font-medium hover:bg-white hover:text-blue-600 transition-colors duration-200"
            >
              返回VIP中心
            </Link>
          </div>
        </div>

        {/* 快速链接 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            快速链接
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/vip/plans"
              className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-all duration-200 text-center"
            >
              <div className="text-3xl mb-3">💎</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">会员计划</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">查看会员计划和价格</p>
            </Link>
            <Link
              href="/vip/benefits"
              className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-all duration-200 text-center"
            >
              <div className="text-3xl mb-3">👑</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">会员权益</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">了解VIP专属权益</p>
            </Link>
            <Link
              href="/vip/redeem"
              className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-all duration-200 text-center"
            >
              <div className="text-3xl mb-3">🎁</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">兑换码</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">使用VIP兑换码</p>
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
