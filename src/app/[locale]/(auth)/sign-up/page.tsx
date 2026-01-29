'use client'
import { UserOutlined, LockOutlined, MailOutlined, EyeInvisibleOutlined, EyeTwoTone, CheckCircleOutlined, GoogleOutlined, GithubOutlined, LoadingOutlined } from '@ant-design/icons'
import { Form, Input, Button, message, Checkbox, Result, Divider } from 'antd'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import React, { useState, useEffect } from 'react'

import { Link } from '@/i18n/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [form] = Form.useForm()
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; username?: string }>({})
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [rateLimitInfo, setRateLimitInfo] = useState<{ retryAfter: number; message: string } | null>(null)

  // 倒计时效果
  useEffect(() => {
    if (!rateLimitInfo) return

    const timer = setInterval(() => {
      setRateLimitInfo(prev => {
        if (!prev) return null
        const newRetryAfter = prev.retryAfter - 1
        if (newRetryAfter <= 0) {
          return null
        }
        return { ...prev, retryAfter: newRetryAfter }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [rateLimitInfo])

  // 密码强度计算
  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/\d/.test(password)) strength += 1
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1
    return strength
  }

  // 实时用户名检查
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 2) return
    setIsCheckingUsername(true)
    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const data = await response.json()
      if (!response.ok) {
        setFieldErrors(prev => ({ ...prev, username: data.error }))
        form.setFields([{ name: 'username', errors: [data.error] }])
      } else {
        setFieldErrors(prev => ({ ...prev, username: undefined }))
        form.setFields([{ name: 'username', errors: [] }])
      }
    } catch (error) {
      console.error('用户名检查失败:', error)
    } finally {
      setIsCheckingUsername(false)
    }
  }

  // 实时邮箱检查
  const checkEmailAvailability = async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    setIsCheckingEmail(true)
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) {
        setFieldErrors(prev => ({ ...prev, email: data.error }))
        form.setFields([{ name: 'email', errors: [data.error] }])
      } else {
        setFieldErrors(prev => ({ ...prev, email: undefined }))
        form.setFields([{ name: 'email', errors: [] }])
      }
    } catch (error) {
      console.error('邮箱检查失败:', error)
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const onFinish = async (values: { email: string; password: string; username: string; confirmPassword: string }) => {
    setFieldErrors({})
    if (!agreedToTerms) {
      message.error('请先同意服务条款和隐私政策')
      return
    }

    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          username: values.username,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // 频率限制特殊处理
        if (response.status === 429) {
          const retryAfter = data.retryAfter || 0
          setRateLimitInfo({
            retryAfter,
            message: data.error
          })
          
          message.error({
            content: `${data.error} (${Math.ceil(retryAfter / 60)}分${retryAfter % 60}秒)`,
            duration: 10, // 显示10秒
          })
          return
        }

        // 字段级错误处理
        if (data.error?.includes('邮箱已被注册')) {
          setFieldErrors({ email: data.error })
          form.setFields([{ name: 'email', errors: [data.error] }])
        } else if (data.error?.includes('用户名已被使用')) {
          setFieldErrors({ username: data.error })
          form.setFields([{ name: 'username', errors: [data.error] }])
        } else {
          message.error(data.error || '注册失败')
        }
        return
      }

      setRegistrationSuccess(true)
      message.success('注册成功！请检查您的邮箱并点击验证链接完成注册。')
    } catch (error: any) {
      message.error(error.message || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: string) => {
    if (!agreedToTerms) {
      message.error('请先同意服务条款和隐私政策')
      return
    }

    try {
      setSocialLoading(provider)
      await signIn(provider, { callbackUrl: '/' })
    } catch (err) {
      message.error(`${provider}登录失败，请重试`)
    } finally {
      setSocialLoading(null)
    }
  }

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-8">
              <Result
                status="success"
                icon={<CheckCircleOutlined />}
                title="注册成功！"
                subTitle="我们已向您的邮箱发送了验证链接，请检查邮箱并点击验证链接完成注册。"
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
        {/* 注册卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-8 text-center relative overflow-hidden">
            {/* 背景装饰 */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-black/10" />
            <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm mb-4">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-2">创建账户</h1>
              <p className="text-white/90">加入我们，开始您的时间线之旅</p>
            </div>
          </div>

          {/* 表单区域 */}
          <div className="p-8">
            {/* 频率限制提示 */}
            {rateLimitInfo && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                    <span className="text-red-800 dark:text-red-200 font-medium">
                      {rateLimitInfo.message}
                    </span>
                  </div>
                  <div className="text-red-600 dark:text-red-400 font-mono text-lg">
                    {Math.floor(rateLimitInfo.retryAfter / 60)}:{(rateLimitInfo.retryAfter % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
            )}

            <Form
              form={form}
              name="register"
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="username"
                validateStatus={fieldErrors.username ? 'error' : undefined}
                help={fieldErrors.username}
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 2, message: '用户名至少2个字符' },
                  { max: 20, message: '用户名不能超过20个字符' },
                  { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' },
                ]}
              >
                <Input
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="用户名"
                  className="rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  suffix={isCheckingUsername ? <LoadingOutlined /> : null}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.length >= 2) {
                      checkUsernameAvailability(value)
                    }
                  }}
                />
              </Form.Item>

              <Form.Item
                name="email"
                validateStatus={fieldErrors.email ? 'error' : undefined}
                help={fieldErrors.email}
                rules={[
                  { required: true, message: '请输入邮箱地址' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-gray-400" />}
                  placeholder="邮箱地址"
                  className="rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  suffix={isCheckingEmail ? <LoadingOutlined /> : null}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                      checkEmailAvailability(value)
                    }
                  }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 8, message: '密码长度至少8位' },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: '密码必须包含大小写字母和数字',
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="密码"
                  className="rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  onChange={(e) => {
                    const strength = calculatePasswordStrength(e.target.value)
                    setPasswordStrength(strength)
                  }}
                />
              </Form.Item>

              {/* 密码强度指示器 */}
              {passwordStrength > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">密码强度</span>
                    <span className={`font-medium ${
                      passwordStrength <= 2 ? 'text-red-500' :
                      passwordStrength <= 3 ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {passwordStrength <= 2 ? '弱' : passwordStrength <= 3 ? '中' : '强'}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-2 flex-1 rounded ${
                          level <= passwordStrength
                            ? passwordStrength <= 2
                              ? 'bg-red-500'
                              : passwordStrength <= 3
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'))
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="确认密码"
                  className="rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              {/* 密码强度提示 */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  密码要求：
                </h4>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• 至少8个字符</li>
                  <li>• 包含大小写字母</li>
                  <li>• 包含数字</li>
                  <li>• 建议包含特殊字符</li>
                </ul>
              </div>

              {/* 服务条款同意 */}
              <div className="mb-6">
                <label className="flex items-start">
                  <Checkbox
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    我已阅读并同意
                    <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                      服务条款
                    </Link>
                    和
                    <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                      隐私政策
                    </Link>
                  </span>
                </label>
              </div>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={!agreedToTerms || !!rateLimitInfo}
                  className="w-full h-12 rounded-xl text-base font-medium bg-gradient-to-r from-green-600 to-blue-600 border-0 hover:from-green-700 hover:to-blue-700 disabled:opacity-50"
                >
                  {loading ? '注册中...' : rateLimitInfo ? '请等待...' : '创建账户'}
                </Button>
              </Form.Item>
            </Form>

            {/* 分割线 */}
            <Divider className="my-6">
              <span className="text-gray-500 dark:text-gray-400 text-sm">或使用以下方式注册</span>
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
                  {socialLoading === provider ? '注册中...' : `使用${name}注册`}
                </button>
              ))}
            </div>

            {/* 登录链接 */}
            <div className="mt-8 text-center">
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
            注册即表示您同意我们的
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
