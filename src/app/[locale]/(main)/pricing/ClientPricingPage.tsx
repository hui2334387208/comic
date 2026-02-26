'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from '@/i18n/navigation'

const pricingPlans = [
  {
    id: 'trial',
    name: '体验版',
    credits: 10,
    price: 12,
    originalPrice: 15,
    popular: false,
    features: [
      '10次生成机会',
      '可生成1个完整漫画',
      '永久有效',
      '生成失败不扣费',
      '新人首选',
    ],
  },
  {
    id: 'starter',
    name: '入门版',
    credits: 50,
    price: 55,
    originalPrice: 65,
    popular: false,
    features: [
      '50次生成机会',
      '可生成约5个漫画',
      '永久有效',
      '生成失败不扣费',
      '省10元',
    ],
  },
  {
    id: 'popular',
    name: '热门版',
    credits: 120,
    price: 120,
    originalPrice: 150,
    popular: true,
    features: [
      '120次生成机会',
      '可生成约12个漫画',
      '永久有效',
      '生成失败不扣费',
      '省30元',
      '性价比最高',
    ],
  },
  {
    id: 'pro',
    name: '专业版',
    credits: 300,
    price: 270,
    originalPrice: 350,
    popular: false,
    features: [
      '300次生成机会',
      '可生成约30个漫画',
      '永久有效',
      '生成失败不扣费',
      '省80元',
      '专属客服支持',
    ],
  },
]

export default function ClientPricingPage() {
  const { status } = useSession()
  const router = useRouter()

  const handlePurchase = (plan: typeof pricingPlans[0]) => {
    if (status === 'unauthenticated') {
      router.push('/sign-in')
      return
    }
    
    // 跳转到购买页面
    router.push(`/pricing/purchase?plan=${plan.id}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 头部 */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            选择适合你的
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> 充值套餐</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            1次 = 生成1张图片，开始创作精彩漫画
          </p>
        </div>

        {/* 套餐卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col ${
                plan.popular ? 'ring-4 ring-purple-600 dark:ring-purple-400' : ''
              }`}
            >
              {/* 热门标签 */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-bl-2xl text-sm font-bold">
                  🔥 最热门
                </div>
              )}

              <div className="p-8 flex flex-col flex-1">
                {/* 套餐名称 */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>

                {/* 价格 */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                      ¥{plan.price}
                    </span>
                    {plan.originalPrice && (
                      <span className="text-lg text-gray-400 line-through">
                        ¥{plan.originalPrice}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {plan.credits} 次生成机会
                  </p>
                </div>

                {/* 功能列表 */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-purple-600 dark:text-purple-400 mt-1">✓</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* 购买按钮 */}
                <button
                  onClick={() => handlePurchase(plan)}
                  className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  立即购买
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 说明 */}
        <div className="mt-16 bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            常见问题
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="text-purple-600">Q:</span>
                如何购买？
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                目前通过兑换码方式充值，请联系客服获取兑换码。后续将开通在线支付功能。
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="text-purple-600">Q:</span>
                次数会过期吗？
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                不会！充值的次数永久有效，随时可以使用。
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="text-purple-600">Q:</span>
                生成失败会扣次数吗？
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                不会！只有成功生成图片才会扣除次数，生成失败不扣费。
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="text-purple-600">Q:</span>
                可以退款吗？
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                已使用的次数不支持退款，未使用的次数可联系客服申请退款。
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            还有疑问？
          </p>
          <button
            onClick={() => router.push('/contact')}
            className="px-8 py-3 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            联系客服
          </button>
        </div>
      </div>
    </div>
  )
}
