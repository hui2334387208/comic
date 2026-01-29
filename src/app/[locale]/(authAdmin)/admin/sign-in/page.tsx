'use client'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { Form, Input, Button, message } from 'antd'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import React from 'react'

export default function AdminLoginPage() {
  const t = useTranslations('admin')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const [loading, setLoading] = React.useState(false)

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      setLoading(true)
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: true,
        callbackUrl: `/${locale}/admin`,
      })

      if (result?.error) {
        message.error(result.error)
        return
      }

      // 获取用户会话信息
      const response = await fetch('/api/auth/session')
      const session = await response.json()

      if (session?.user?.role === 'admin') {
        router.push(`/${locale}/admin`)
      } else {
        message.error(t('auth.invalidCredentials'))
        await signIn('credentials', { redirect: false }) // 清除当前会话
        router.push(`/${locale}/sign-in`)
      }
    } catch (error) {
      message.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('layout.admin')} {t('auth.login')}
          </h2>
        </div>
        <Form
          name="admin-login"
          onFinish={onFinish}
          className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: t('common.required') },
              { type: 'email', message: t('auth.email') },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t('auth.email')}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('auth.password')}
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full"
              size="large"
            >
              {t('auth.login')}
            </Button>
          </Form.Item>

          <div className="text-center">
            <Link href={`/${locale}/sign-in`} className="text-gray-600 hover:text-gray-800">
              {t('common.back')}
            </Link>
          </div>
        </Form>
      </div>
    </div>
  )
}
