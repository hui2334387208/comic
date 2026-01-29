'use client'

import { useSession } from 'next-auth/react'
import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import dayjs from 'dayjs'

import { Link, useRouter } from '@/i18n/navigation'

interface Order {
  id: string;
  orderNo: string;
  planName: string;
  amount: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  paidAt?: string;
  expireAt?: string;
}

export default function VipOrdersPage() {
  const { data: session } = useSession()
  const t = useTranslations('main.vip.ordersPage')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (session?.user?.id) {
      fetchOrders()
    }
  }, [session])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/vip/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      } else {
        setOrders([])
      }
    } catch (error) {
      console.error('获取订单失败:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      in_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      refunded: 'bg-gray-100 text-gray-800 dark:text-gray-900 dark:text-gray-200',
    }
    const color = statusMap[status] || 'bg-gray-200 text-gray-800'
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>
        {t('statusMap.' + status) || t('statusMap.unknown')}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY-MM-DD HH:mm')
  }

  const downloadInvoice = (order: Order) => {
    // 模拟下载发票
    const invoiceData = {
      orderNumber: order.orderNo,
      planName: order.planName,
      amount: order.amount,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
    }

    const blob = new Blob([JSON.stringify(invoiceData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${order.orderNo}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl" />
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
              📋 {t('title')}
            </span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            {t('pageTitle')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {t('pageDesc')}
          </p>
        </div>

        {/* 订单统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {orders.length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">{t('totalOrders')}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {orders.filter(o => o.status === 'completed').length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">{t('paid')}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
              {orders.filter(o => o.status === 'pending').length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">{t('pending')}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              ¥{orders
               .filter(o => o.status === 'completed')
               .reduce((sum, o) => sum + parseFloat(o.amount), 0).toFixed(2)}
            </div>
            <div className="text-gray-600 dark:text-gray-400">{t('totalAmount')}</div>
          </div>
        </div>

        {/* 订单列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t('orderHistory')}
          </h2>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('noOrders')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('noOrdersDesc')}
              </p>
              <Link
                href="/vip/plans"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
              >
                {t('buyNow')}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="grid grid-cols-[minmax(0,_2fr)_minmax(0,_1fr)_minmax(0,_1.5fr)_minmax(0,_1.5fr)] gap-x-6 items-center border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  {/* Column 1: Plan/OrderNo */}
                  <div>
                    <div className="flex items-center space-x-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{order.planName}</h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {t('orderNo')}：{order.orderNo}
                    </p>
                  </div>

                  {/* Column 2: Payment Method */}
                  <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {t('paymentMethod')}：{order.paymentMethod}
                  </div>

                  {/* Column 3: Creation Time */}
                  <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {t('createdAt')}：{formatDate(order.createdAt)}
                  </div>

                  {/* Column 4: Amount/Actions */}
                  <div className="flex items-center justify-end space-x-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ¥{parseFloat(order.amount).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.status === 'completed' && order.paidAt && (
                          <span className="whitespace-nowrap">{t('payTime')}：{formatDate(order.paidAt)}</span>
                        )}
                      </div>
                    </div>
                    <div className="w-24 flex justify-end">
                      {order.status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/vip/payment/${order.orderNo}`)
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm whitespace-nowrap"
                        >
                          {t('continuePay')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 订单详情弹窗 */}
        {selectedOrder && (
           <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50" onClick={() => setSelectedOrder(null)}>
               <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-8 m-4" onClick={(e) => e.stopPropagation()}>
                   <div className="flex justify-between items-start mb-6">
                       <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('orderDetail')}</h2>
                       <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                       </button>
                   </div>

                   <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                       <div className="space-y-4">
                           <p className="text-gray-600 dark:text-gray-400">{t('orderNo')}：<span className="font-mono text-gray-800 dark:text-gray-200">{selectedOrder.orderNo}</span></p>
                           <p className="text-gray-600 dark:text-gray-400">{t('amount')}：<span className="font-semibold text-gray-800 dark:text-gray-200">¥{parseFloat(selectedOrder.amount).toFixed(2)}</span></p>
                           <div className="flex items-center">
                               <p className="text-gray-600 dark:text-gray-400 mr-2">{t('status')}：</p>
                               {getStatusBadge(selectedOrder.status)}
                           </div>
                           {selectedOrder.paidAt && <p className="text-gray-600 dark:text-gray-400">{t('paidAt')}：<span className="text-gray-800 dark:text-gray-200">{formatDate(selectedOrder.paidAt)}</span></p>}
                       </div>
                       <div className="space-y-4">
                           <p className="text-gray-600 dark:text-gray-400">{t('plan')}：<span className="text-gray-800 dark:text-gray-200">{selectedOrder.planName}</span></p>
                           <p className="text-gray-600 dark:text-gray-400">{t('paymentMethod')}：<span className="text-gray-800 dark:text-gray-200">{selectedOrder.paymentMethod}</span></p>
                           <p className="text-gray-600 dark:text-gray-400">{t('createdAt')}：<span className="text-gray-800 dark:text-gray-200">{formatDate(selectedOrder.createdAt)}</span></p>
                           {selectedOrder.expireAt && <p className="text-gray-600 dark:text-gray-400">{t('expireAt')}：<span className="text-gray-800 dark:text-gray-200">{formatDate(selectedOrder.expireAt)}</span></p>}
                       </div>
                   </div>

                   <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                       <button
                           onClick={() => setSelectedOrder(null)}
                           className="px-5 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                       >
                           {t('close')}
                       </button>
                   </div>
               </div>
           </div>
       )}

        {/* 返回链接 */}
        <div className="text-center mt-8">
          <Link
            href="/vip"
            className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>{t('backToVip') || '返回VIP中心'}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
