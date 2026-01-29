'use client'
import { UserOutlined, LockOutlined, MailOutlined, KeyOutlined } from '@ant-design/icons'
import { Form, Input, Button, message } from 'antd'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React from 'react'

export default function AdminRegisterPage() {
  const t = useTranslations('admin')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const [loading, setLoading] = React.useState(false)

  const onFinish = async (values: { email: string; password: string; username: string; secretKey: string }) => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          role: 'admin',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('common.error'))
      }

      message.success(t('auth.registerSuccess'))
      router.push(`/${locale}/sign-in`)
    } catch (error: any) {
      message.error(error.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.adminRegister')}
          </h2>
        </div>
        <Form
          name="admin-register"
          onFinish={onFinish}
          className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t('auth.username')}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: t('common.required') },
              { type: 'email', message: t('auth.validEmail') },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder={t('auth.email')}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: t('common.required') },
              { min: 8, message: '密码长度至少8位' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: '密码必须包含大小写字母和数字',
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('auth.password')}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="secretKey"
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input.Password
              prefix={<KeyOutlined />}
              placeholder={t('auth.secretKey')}
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
              {t('auth.register')}
            </Button>
          </Form.Item>

          <div className="text-center">
            <Button type="link" onClick={() => router.push(`/${locale}/admin/sign-in`)}>
              {t('auth.haveAccount')}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  )
}
