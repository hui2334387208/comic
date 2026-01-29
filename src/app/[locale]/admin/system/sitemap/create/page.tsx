'use client'

import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, Select, DatePicker, message, Space, Typography } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { withPagePermission } from '@/lib/withPagePermission'

const { Title } = Typography
const { Option } = Select

interface SitemapFormValues {
  url: string
  lastmod?: string
  changefreq?: string
  priority?: number
  hreflang?: string
}

const CreateSitemapPage = () => {
  const t = useTranslations('admin')
  const router = useRouter()
  const [form] = Form.useForm<SitemapFormValues>()
  const [submitting, setSubmitting] = useState(false)

  const handleFinish = async (values: SitemapFormValues) => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/system/sitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        message.success(t('sitemap.createSuccess'))
        router.push('/admin/system/sitemap')
      } else {
        const data = await response.json()
        message.error(data.message || t('sitemap.createFailed'))
      }
    } catch (error) {
      message.error(t('sitemap.createFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* 渐变背景标题区域 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '24px 32px',
        borderRadius: 12,
        marginBottom: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}>
        <Title level={2} style={{ color: 'white', margin: 0 }}>{t('sitemap.createTitle')}</Title>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>{t('sitemap.createDescription')}</p>
      </div>

      {/* 表单卡片 */}
      <Card
        title={<span style={{ fontWeight: 600 }}>{t('sitemap.basicInfo')}</span>}
        style={{
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #f0f0f0',
          width: '100%'
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            priority: 0.5,
            changefreq: 'daily'
          }}
        >
          <Form.Item
            name="url"
            label={t('sitemap.urlPath')}
            rules={[{ required: true, message: t('sitemap.urlPathRequired') }]}
          >
            <Input placeholder={t('sitemap.urlPathPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="changefreq"
            label={t('sitemap.updateFrequency')}
            rules={[{ required: true, message: t('sitemap.selectFrequency') }]}
          >
            <Select placeholder={t('sitemap.selectFrequency')}>
              <Option value="always">{t('sitemap.frequencyOptions.always')}</Option>
              <Option value="hourly">{t('sitemap.frequencyOptions.hourly')}</Option>
              <Option value="daily">{t('sitemap.frequencyOptions.daily')}</Option>
              <Option value="weekly">{t('sitemap.frequencyOptions.weekly')}</Option>
              <Option value="monthly">{t('sitemap.frequencyOptions.monthly')}</Option>
              <Option value="yearly">{t('sitemap.frequencyOptions.yearly')}</Option>
              <Option value="never">{t('sitemap.frequencyOptions.never')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label={t('sitemap.priority')}
            rules={[{ required: true, message: t('sitemap.priorityRequired') }]}
          >
            <Input
              type="number"
              min={0}
              max={1}
              step={0.1}
              placeholder={t('sitemap.priorityPlaceholder')}
            />
          </Form.Item>

          <Form.Item name="hreflang" label={t('sitemap.language')}>
            <Select placeholder={t('sitemap.selectLanguage')} allowClear>
              <Option value="zh">{t('sitemap.languageOptions.zh')}</Option>
              <Option value="en">{t('sitemap.languageOptions.en')}</Option>
            </Select>
          </Form.Item>

          <Form.Item name="lastmod" label={t('sitemap.lastModified')}>
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder={t('sitemap.selectLastModified')}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24, textAlign: 'left' }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {t('sitemap.create')}
              </Button>
              <Button onClick={() => router.push('/admin/system/sitemap')}>
                {t('sitemap.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default withPagePermission(CreateSitemapPage, {
  permission: 'sitemap.create'
}) 