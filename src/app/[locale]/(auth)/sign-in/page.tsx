'use client'
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone, GoogleOutlined, GithubOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { Form, Input, Button, Alert, Divider } from 'antd'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import React, { useState, useEffect } from 'react'

import { Link } from '@/i18n/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number>(0)
  const [isAccountLocked, setIsAccountLocked] = useState(false)

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && isAccountLocked) {
      // 倒计时结束时，重置账户锁定状态
      setIsAccountLocked(false)
      setError(null) // 清除错误信息
    }
  }, [countdown, isAccountLocked])

  const onFinish = async (values: { email: string; password: string }) => {
    setError(null)
    setIsAccountLocked(false)
    setCountdown(0)
    
    try {
      setLoading(true)
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
        
        // 检查是否是账户锁定错误
        if (result.error.includes('账户已被锁定') || result.error.includes('请等待')) {
          setIsAccountLocked(true)
          // 提取等待时间
          const match = result.error.match(/(\d+)\s*分钟/)
          if (match) {
            const minutes = parseInt(match[1])
            setCountdown(minutes * 60)
          }
        }
        return
      }

      router.push('/')
    } catch (err) {
      setError('登录过程中发生未知错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: string) => {
    setError(null)
    try {
      setSocialLoading(provider)
      await signIn(provider, { callbackUrl: '/' })
    } catch (err) {
      setError(`${provider}登录失败，请重试`)
    } finally {
      setSocialLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* 登录卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center relative overflow-hidden">
            {/* 背景装饰 */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-black/10" />
            <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm mb-4">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-2">欢迎回来</h1>
              <p className="text-white/90">登录您的账户继续探索文鳐对联</p>
            </div>
          </div>

          {/* 表单区域 */}
          <div className="p-8">
            {error && (
              <Alert
                message={
                  error.includes('请先验证您的邮箱地址') ? (
                    <div>
                      {error}
                      <br />
                      <Link href="/resend-verification" className="text-blue-600 hover:underline">
                        重新发送验证邮件
                      </Link>
                    </div>
                  ) : isAccountLocked ? (
                    <div>
                      <div className="flex items-center mb-2">
                        <ExclamationCircleOutlined className="mr-2 text-red-500" />
                        <span className="font-medium">账户已被锁定</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {error.replace(/账户已被锁定：/, '').replace(/。请等待.*/, '')}
                      </div>
                      {countdown > 0 && (
                        <div className="flex items-center text-sm text-orange-600 bg-orange-50 p-2 rounded">
                          <ClockCircleOutlined className="mr-1" />
                          请等待 {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')} 后重试
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {error}
                      {countdown > 0 && (
                        <div className="mt-2 flex items-center text-sm text-gray-600">
                          <ClockCircleOutlined className="mr-1" />
                          请等待 {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')} 后重试
                        </div>
                      )}
                    </div>
                  )
                }
                type={isAccountLocked ? "error" : "error"}
                showIcon
                className="mb-6"
              />
            )}
            <Form
              name="login"
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
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="邮箱地址"
                  className="rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="密码"
                  className="rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <div className="flex items-center justify-between mb-6">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">记住我</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  忘记密码？
                </Link>
              </div>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={isAccountLocked || countdown > 0}
                  className="w-full h-12 rounded-xl text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 border-0 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '登录中...' : 
                   isAccountLocked ? '账户已锁定' :
                   countdown > 0 ? `请等待 ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}` : 
                   '登录'}
                </Button>
              </Form.Item>
            </Form>

            {/* 分割线 */}
            <Divider className="my-6">
              <span className="text-gray-500 dark:text-gray-400 text-sm">或使用以下方式登录</span>
            </Divider>

            {/* 社交登录 */}
            <div className="space-y-3">
              {[
                {
                  provider: 'google',
                  name: 'Google',
                  icon: <GoogleOutlined className="mr-3 text-lg" />,
                },
                {
                  provider: 'github',
                  name: 'GitHub',
                  icon: <GithubOutlined className="mr-3 text-lg" />,
                },
              ].map(({ provider, name, icon }) => (
                <button
                  key={provider}
                  onClick={() => handleSocialLogin(provider)}
                  disabled={!!socialLoading}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
                >
                  {icon}
                  {socialLoading === provider ? '登录中...' : `使用${name}登录`}
                </button>
              ))}
            </div>

            {/* 注册链接 */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                还没有账户？
                <Link
                  href="/sign-up"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                >
                  立即注册
                </Link>
              </p>
            </div>

            {/* 重新发送验证邮件链接 */}
            <div className="mt-4 text-center">
              <Link
                href="/resend-verification"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
              >
                没有收到验证邮件？
              </Link>
            </div>

            {/* 管理员登录 */}
            <div className="mt-4 text-center">
              <Link
                href="/admin/sign-in"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
              >
                管理员登录
              </Link>
            </div>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            登录即表示您同意我们的
            <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
              服务条款
            </Link>
            和
            <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
              隐私政策
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
