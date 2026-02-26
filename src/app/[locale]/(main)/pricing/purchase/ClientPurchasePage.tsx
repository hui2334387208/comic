'use client'

import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

const pricingPlans = [
  {
    id: 'trial',
    name: '体验版',
    credits: 10,
    price: 12,
    originalPrice: 15,
  },
  {
    id: 'starter',
    name: '入门版',
    credits: 50,
    price: 55,
    originalPrice: 65,
  },
  {
    id: 'popular',
    name: '热门版',
    credits: 120,
    price: 120,
    originalPrice: 150,
  },
  {
    id: 'pro',
    name: '专业版',
    credits: 300,
    price: 270,
    originalPrice: 350,
  },
]

export default function ClientPurchasePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const planId = searchParams.get('plan')

  const selectedPlan = pricingPlans.find(p => p.id === planId) || pricingPlans[2]

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 返回按钮 */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          <span>←</span>
          <span>返回套餐选择</span>
        </button>

        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            购买 <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{selectedPlan.name}</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            选择以下任一方式完成购买
          </p>
        </div>

        {/* 套餐信息卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {selectedPlan.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedPlan.credits} 次生成机会
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                ¥{selectedPlan.price}
              </div>
              {selectedPlan.originalPrice && (
                <div className="text-sm text-gray-400 line-through">
                  原价 ¥{selectedPlan.originalPrice}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 购买方式 */}
        <div className="space-y-6 mb-8">
          {/* 方式1：微信公众号 */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
              <div className="flex items-center gap-3 text-white">
                <span className="text-4xl">📱</span>
                <div>
                  <h3 className="text-2xl font-bold">方式一：微信公众号</h3>
                  <p className="text-green-100">推荐 • 即时到账 • 客服在线</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3">📝 购买步骤：</h4>
                  <ol className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-green-600 min-w-[24px]">1.</span>
                      <span>打开微信，搜索公众号：<span className="font-bold text-green-600">【你的公众号名称】</span></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-green-600 min-w-[24px]">2.</span>
                      <span>关注后，发送消息：<span className="font-bold">购买{selectedPlan.name}</span></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-green-600 min-w-[24px]">3.</span>
                      <span>客服会发送付款二维码</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-green-600 min-w-[24px]">4.</span>
                      <span>扫码支付 ¥{selectedPlan.price}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-green-600 min-w-[24px]">5.</span>
                      <span>付款后立即获得兑换码</span>
                    </li>
                  </ol>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      // 复制公众号名称
                      navigator.clipboard.writeText('你的公众号名称')
                      alert('公众号名称已复制！')
                    }}
                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  >
                    📋 复制公众号名称
                  </button>
                  <button
                    onClick={() => {
                      window.open('https://mp.weixin.qq.com/', '_blank')
                    }}
                    className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all"
                  >
                    前往微信公众号
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 方式2：闲鱼 */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
              <div className="flex items-center gap-3 text-white">
                <span className="text-4xl">🐟</span>
                <div>
                  <h3 className="text-2xl font-bold">方式二：闲鱼购买</h3>
                  <p className="text-orange-100">自动发货 • 担保交易 • 安全可靠</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3">📝 购买步骤：</h4>
                  <ol className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-orange-600 min-w-[24px]">1.</span>
                      <span>打开闲鱼APP</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-orange-600 min-w-[24px]">2.</span>
                      <span>搜索店铺：<span className="font-bold text-orange-600">【你的闲鱼店铺名称】</span></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-orange-600 min-w-[24px]">3.</span>
                      <span>找到商品：{selectedPlan.name} - ¥{selectedPlan.price}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-orange-600 min-w-[24px]">4.</span>
                      <span>下单并完成支付</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-orange-600 min-w-[24px]">5.</span>
                      <span>系统自动发货兑换码到订单消息</span>
                    </li>
                  </ol>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText('你的闲鱼店铺名称')
                    alert('店铺名称已复制！请在闲鱼APP中搜索')
                  }}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all"
                >
                  📋 复制店铺名称
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 购买后流程 */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🎁</span>
            获得兑换码后如何使用？
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 dark:text-purple-400 font-bold">1</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-900 dark:text-white font-medium">获得兑换码</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">格式：XXXX-XXXX-XXXX</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 dark:text-purple-400 font-bold">2</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-900 dark:text-white font-medium">前往兑换页面</p>
                <button
                  onClick={() => router.push('/credits/redeem')}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                >
                  点击前往兑换 →
                </button>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 dark:text-purple-400 font-bold">3</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-900 dark:text-white font-medium">输入兑换码</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">次数立即到账，开始创作！</p>
              </div>
            </div>
          </div>
        </div>

        {/* 温馨提示 */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-6">
          <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span>💡</span>
            温馨提示
          </h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>兑换码一旦使用无法退款，请妥善保管</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>充值的次数永久有效，不会过期</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>每个兑换码只能使用一次</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>如有问题请联系客服处理</span>
            </li>
          </ul>
        </div>

        {/* 联系客服 */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            遇到问题？
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
