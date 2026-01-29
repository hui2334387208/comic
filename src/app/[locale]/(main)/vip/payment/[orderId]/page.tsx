'use client'

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  WechatOutlined,
  BankOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { Input, message, Spin } from 'antd'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import dayjs from 'dayjs'
import React, { useState, useEffect } from 'react'

interface OrderDetails {
  id: string;
  orderNo: string;
  amount: string;
  status: string;
  createdAt: string;
  planName: string;
  planDuration: string;
}

const paymentMethods = [
  {
    id: 'alipay',
    icon: '💳',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'wechat',
    icon: '💚',
    color: 'from-green-500 to-green-600',
  },
  // {
  //   id: 'bank',
  //   icon: '🏦',
  //   color: 'from-purple-600 to-indigo-600'
  // }
]

export default function PaymentPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const { data: session } = useSession()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('alipay')
  const [enteredOrderNo, setEnteredOrderNo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const t = useTranslations('main.vip.paymentPage')

  useEffect(() => {
    if (orderId && session?.user) {
      fetchOrderDetails()
    }
  }, [orderId, session])

  const fetchOrderDetails = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/vip/orders/${orderId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t('orderLoadError'))
      }
      const data = await response.json()
      setOrder(data.order)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentConfirmed = async () => {
    if (!enteredOrderNo.trim()) {
      message.error(t('enterOrderNo'))
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/vip/orders/${orderId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod: selectedMethod,
          userSubmittedTransactionId: enteredOrderNo.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('submitError'))
      }

      message.success(t('submitSuccess'))
      // Optionally, you can redirect the user or update the UI to show the "in_review" status.
      fetchOrderDetails() // Refresh order details to show the new status
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderPaymentContent = () => {
    switch (selectedMethod) {
      case 'alipay':
        return (
          <div className="text-center space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-8">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('paymentMethods.alipay.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{t('paymentMethods.alipay.instruction')}</p>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-dashed border-blue-200 dark:border-blue-700">
                <img
                  src="https://kjlojjkipljt0fr1.public.blob.vercel-storage.com/common/zhifubao-EZCSny0t7eTB666ZrySiwrmRoQPBQG.jpg"
                  alt="Alipay QR Code"
                  className="mx-auto rounded-lg shadow-md"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">扫码支付 ¥{order?.amount}</p>
              </div>
            </div>
          </div>
        )
      case 'wechat':
        return (
          <div className="text-center space-y-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-8">
              <div className="text-4xl mb-4">💚</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('paymentMethods.wechat.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{t('paymentMethods.wechat.instruction')}</p>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-dashed border-green-200 dark:border-green-700">
                <img
                  src="https://kjlojjkipljt0fr1.public.blob.vercel-storage.com/common/weixin-Du2lA10HHIUGwSe2xxZcQasx6M9MAq.jpg"
                  alt="WeChat QR Code"
                  className="mx-auto rounded-lg shadow-md"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">扫码支付 ¥{order?.amount}</p>
              </div>
            </div>
          </div>
        )
      case 'bank':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-2xl p-8">
              <div className="text-4xl mb-4 text-center">🏦</div>
              <h3 className="text-xl font-semibold mb-4 text-center text-gray-900 dark:text-white">{t('paymentMethods.bank.title')}</h3>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg">
                  <span className="font-medium text-gray-500 dark:text-gray-400">{t('paymentMethods.bank.bankName')}</span>
                  <span className="text-gray-900 dark:text-white font-semibold">中国工商银行 XX分行</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg">
                  <span className="font-medium text-gray-500 dark:text-gray-400">{t('paymentMethods.bank.accountName')}</span>
                  <span className="text-gray-900 dark:text-white font-semibold">时间线网络科技有限公司</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg">
                  <span className="font-medium text-gray-500 dark:text-gray-400">{t('paymentMethods.bank.accountNumber')}</span>
                  <span className="text-gray-900 dark:text-white font-semibold font-mono">6222 0200 0000 1234 567</span>
                </div>
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    💡 {t('paymentMethods.bank.reminder')}<strong className="block font-semibold mt-1">{order?.orderNo}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spin size="large" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('loadingOrder')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('pleaseWait')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('orderLoadError')}</h1>
          <p className="text-red-500 max-w-md">{error}</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('orderNotFound')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('checkOrderNo')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
            <CreditCardOutlined className="text-2xl text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">{t('title')}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('subtitle')}
            <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">#{order.orderNo}</span>
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400">{t('manualReview')}</p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 订单信息 */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                <ClockCircleOutlined className="text-xl text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('orderDetails')}</h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{t('orderNo')}</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">{order.orderNo}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{t('productName')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{order.planName}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{t('membershipDuration')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{order.planDuration}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{t('createTime')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {dayjs(order.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                  <span className="text-xl font-bold text-gray-700 dark:text-gray-300">{t('totalAmount')}</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ¥{order.amount}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700">
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('orderStatus')}</span>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center ${{
                    pending:
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                    in_review:
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400',
                    completed:
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                    rejected:
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
                    cancelled:
                      'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
                    refunded:
                      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-400',
                  }[order.status] ?? 'bg-gray-100'}`}
                >
                  {{
                    pending: <ClockCircleOutlined className="mr-1" />,
                    in_review: <ClockCircleOutlined className="mr-1" />,
                    completed: <CheckCircleOutlined className="mr-1" />,
                    rejected: <CloseCircleOutlined className="mr-1" />,
                    cancelled: <MinusCircleOutlined className="mr-1" />,
                    refunded: <ExclamationCircleOutlined className="mr-1" />,
                  }[order.status] ?? <ClockCircleOutlined className="mr-1" />}
                  {t(`statusMap.${order.status}` as any) || order.status}
                </span>
              </div>
            </div>
          </div>

          {/* 支付方式 */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center mr-4">
                <CreditCardOutlined className="text-xl text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('selectPaymentMethod')}</h2>
            </div>

            {/* 支付方式选择 */}
            <div className="grid grid-cols-1 gap-4 mb-8">
              {paymentMethods.map(method => {
                const isSelected = selectedMethod === method.id
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 w-full text-left ${
                      isSelected
                        ? `bg-gradient-to-r ${method.color} text-white shadow-lg border-transparent`
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{method.icon}</div>
                      <div className="flex-1">
                        <div className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{t(`paymentMethods.${method.id}.name`)}</div>
                        <div className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>{t(`paymentMethods.${method.id}.description`)}</div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                           <CheckCircleOutlined className="text-white text-base" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* 支付内容 */}
            <div className="mb-8">
              {renderPaymentContent()}
            </div>

            {/* 订单号输入 */}
            {
              !(order.status === 'in_review' || order.status === 'completed') ?
                <div className="space-y-4">
                  <label htmlFor="orderNoInput" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('paymentOrderNo')}
                  </label>
                  <Input
                    id="orderNoInput"
                    placeholder={t('paymentOrderNoPlaceholder')}
                    value={enteredOrderNo}
                    onChange={(e) => setEnteredOrderNo(e.target.value)}
                    className="h-12 text-base rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:border-blue-500 dark:focus:border-blue-500"
                    prefix={<CreditCardOutlined className="text-gray-400" />}
                  />
                  {/* <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 请确保输入的订单号与上方显示的订单号一致
              </p> */}
                </div>
                : null
            }

            {/* 提交按钮 */}
            <button
              onClick={handlePaymentConfirmed}
              disabled={!enteredOrderNo.trim() || isSubmitting || order.status === 'in_review' || order.status === 'completed'}
              className={`w-full mt-6 py-4 px-6 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-2xl transition-all duration-300 font-semibold text-lg shadow-lg ${
                (!enteredOrderNo.trim() || isSubmitting || order.status === 'in_review' || order.status === 'completed')
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:from-green-600 hover:to-teal-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <Spin size="small" />
                  <span>{t('submitting')}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircleOutlined />
                  <span>{t('confirmPayment')}</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
