'use client'
import { CheckCircleOutlined, ExclamationCircleOutlined, LoadingOutlined, MailOutlined } from '@ant-design/icons'
import { Button, Result } from 'antd'
import { useSearchParams, useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('验证链接无效')
      return
    }

    verifyEmail(token)
  }, [searchParams])

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.message)
      } else {
        setStatus('error')
        setMessage(data.error || '验证失败')
      }
    } catch (error) {
      setStatus('error')
      setMessage('验证过程中发生错误，请重试')
    }
  }

  const handleResendVerification = () => {
    router.push('/resend-verification')
  }

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <Result
            icon={<LoadingOutlined style={{ color: '#1890ff' }} />}
            title="正在验证邮箱..."
            subTitle="请稍候，我们正在验证您的邮箱地址"
          />
        )

      case 'success':
        return (
          <Result
            status="success"
            icon={<CheckCircleOutlined />}
            title="邮箱验证成功！"
            subTitle={message}
            extra={[
              <Button type="primary" key="login" onClick={() => router.push('/sign-in')}>
                立即登录
              </Button>,
              <Button key="home" onClick={() => router.push('/')}>
                返回首页
              </Button>,
            ]}
          />
        )

      case 'error':
        return (
          <Result
            status="error"
            icon={<ExclamationCircleOutlined />}
            title="验证失败"
            subTitle={message}
            extra={[
              <Button
                type="primary"
                key="resend"
                icon={<MailOutlined />}
                onClick={handleResendVerification}
              >
                重新发送验证邮件
              </Button>,
              <Button key="sign-up" onClick={() => router.push('/sign-up')}>
                重新注册
              </Button>,
              <Button key="home" onClick={() => router.push('/')}>
                返回首页
              </Button>,
            ]}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
