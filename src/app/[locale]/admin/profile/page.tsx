'use client'

import { UserOutlined, UploadOutlined } from '@ant-design/icons'
import { Card, Form, Input, Button, Avatar, message, Upload, Spin } from 'antd'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { withPagePermission } from '@/lib/withPagePermission'

import { loggerClient } from '@/lib/logger-client'


function ProfilePage() {
  const t = useTranslations('admin')
  const { data: session, status, update: updateSession } = useSession()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // 监听 session 变化，更新表单数据和头像
  useEffect(() => {
    if (session?.user) {
      form.setFieldsValue({
        name: session.user.name || '',
        email: session.user.email || '',
      })
      setAvatarUrl(session.user.avatar)
    }
  }, [session, form])

  // 头像上传处理
  const handleAvatarUpload = async ({ file }: { file: File }) => {
    setAvatarUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'avatar')
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.url) {
        setAvatarUrl(data.url)
        message.success(t('profile.avatarUploadSuccess'))
      } else {
        message.error(data.error || t('profile.avatarUploadFailed'))
      }
    } catch (e) {
      message.error(t('profile.avatarUploadFailed'))
    } finally {
      setAvatarUploading(false)
    }
  }

  // 表单提交
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...values, avatar: avatarUrl }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || t('profile.updateFailed'))
      }
      // 更新 session
      await updateSession()
      await loggerClient.info({
        module: 'admin',
        action: 'update_profile',
        description: t('profile.updateSuccess'),
        userId: session?.user?.id,
      })
      message.success(t('profile.updateSuccess'))
      form.resetFields(['currentPassword', 'newPassword', 'confirmPassword'])
    } catch (error) {
      message.error(error instanceof Error ? error.message : t('profile.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  // 如果 session 正在加载，显示加载状态
  if (status === 'loading') {
    return <div>{t('profile.loading')}</div>
  }

  // 如果没有 session，显示未登录状态
  if (!session) {
    return <div>{t('profile.pleaseLogin')}</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card title={t('profile.title')} variant="outlined">
        <div className="flex flex-col items-center mb-8">
          <Spin spinning={avatarUploading}>
            <Avatar
              size={100}
              src={avatarUrl}
              icon={!avatarUrl && <UserOutlined />}
              className="mb-4"
            />
          </Spin>
          <Upload
            showUploadList={false}
            customRequest={({ file }) => handleAvatarUpload({ file: file as File })}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />} loading={avatarUploading} disabled={avatarUploading}>
              {t('profile.avatar')}
            </Button>
          </Upload>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: session.user.name || '',
            email: session.user.email || '',
          }}
          onFinish={handleSubmit}
        >
          <Form.Item
            label={t('profile.username')}
            name="name"
            rules={[{ required: true, message: t('profile.enterUsername') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t('profile.email')}
            name="email"
            rules={[
              { required: true, message: t('profile.enterEmail') },
              { type: 'email', message: t('auth.validEmail') },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t('profile.currentPassword')}
            name="currentPassword"
            rules={[{ required: true, message: t('profile.enterCurrentPassword') }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label={t('profile.newPassword')}
            name="newPassword"
            rules={[
              { min: 8, message: '密码长度至少8位' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: '密码必须包含大小写字母和数字',
              },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label={t('profile.confirmPassword')}
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error(t('profile.passwordMismatch')))
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {t('profile.saveChanges')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default withPagePermission(ProfilePage, {
  permissions: ['user.read'],
  requireAll: false
})
