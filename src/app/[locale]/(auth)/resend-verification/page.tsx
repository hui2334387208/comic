'use client'
import { MailOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { Form, Input, Button, message, Result } from 'antd'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { Link } from '@/i18n/navigation'

export default function ResendVerificationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [form] = Form.useForm()

  const onFinish = async (values: { email: string }) => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: values.email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        message.success(data.message)
      } else {
        const errorMessage = data.error || '重新发送验证邮件失败'
        setError(errorMessage)
        
        // 如果是频率限制错误，启动倒计时
        if (response.status === 429 && data.retryAfter) {
          setCountdown(Math.ceil(data.retryAfter))
          startCountdown(data.retryAfter)
        }
      }
    } catch (error) {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const startCountdown = (seconds: number) => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setError('') // 倒计时结束后清除错误提示
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-8">
              <Result
                status="success"
                icon={<CheckCircleOutlined />}
                title="验证邮件已发送！"
                subTitle="请检查您的邮箱并点击验证链接完成注册。"
                extra={[
                  <Button type="primary" key="login" onClick={() => router.push('/sign-in')}>
                    前往登录
                  </Button>,
                  <Button key="home" onClick={() => router.push('/')}>
                    返回首页
                  </Button>,
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* 重新发送验证邮件卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-8 text-center relative overflow-hidden">
            {/* 背景装饰 */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-black/10" />
            <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm mb-4">
                <MailOutlined className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2">重新发送验证邮件</h1>
              <p className="text-white/90">没有收到验证邮件？重新发送一封</p>
            </div>
          </div>

          {/* 表单区域 */}
          <div className="p-8">
            <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                为什么需要重新发送？
              </h4>
              <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                <li>• 验证邮件可能被误判为垃圾邮件</li>
                <li>• 验证链接可能已过期（24小时有效期）</li>
                <li>• 邮箱地址输入错误</li>
                <li>• 邮件服务器延迟</li>
              </ul>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center text-red-700">
                  <ExclamationCircleOutlined className="mr-2" />
                  <span className="text-sm">
                    {countdown > 0 ? `操作过于频繁，请等待 ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')} 后重试` : error}
                  </span>
                </div>
              </div>
            )}

            <Form
              form={form}
              name="resend-verification"
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱地址' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-gray-400" />}
                  placeholder="请输入您注册时使用的邮箱地址"
                  className="rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={countdown > 0}
                  className="w-full h-12 rounded-xl text-base font-medium bg-gradient-to-r from-orange-600 to-red-600 border-0 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '发送中...' : '重新发送验证邮件'}
                </Button>
              </Form.Item>
            </Form>

            {/* 其他链接 */}
            <div className="mt-8 space-y-3 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                还没有账户？
                <Link
                  href="/sign-up"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                >
                  立即注册
                </Link>
              </p>

              <p className="text-gray-600 dark:text-gray-400">
                已有账户？
                <Link
                  href="/sign-in"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                >
                  立即登录
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            如果问题仍然存在，请联系
            <Link href="/support" className="text-blue-600 dark:text-blue-400 hover:underline">
              客服支持
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
