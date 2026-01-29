'use client'

import {
  message, Typography, Button, Form, Input,
  InputNumber, Switch, Breadcrumb, Space, Card, Tag,
} from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import { withPagePermission } from '@/lib/withPagePermission'

const { Title } = Typography

// 预定义的功能列表
// const DEFAULT_FEATURES = [
//   { id: 'unlimited_timelines', name: '无限时间线', description: '创建无限数量的时间线', enabled: true },
//   { id: 'ai_assistant', name: 'AI助手', description: '使用AI助手生成时间线内容', enabled: true },
//   { id: 'advanced_export', name: '高级导出', description: '支持多种格式导出', enabled: true },
//   { id: 'custom_themes', name: '自定义主题', description: '使用自定义主题和样式', enabled: true },
//   { id: 'priority_support', name: '优先支持', description: '获得优先客户支持服务', enabled: true },
//   { id: 'analytics', name: '数据分析', description: '查看详细的使用数据分析', enabled: true }
// ];

const DEFAULT_FEATURES = [
  { id: '1', name: '高级提示词功能', description: '高级提示词功能', enabled: true },
  { id: '2', name: '全模型支持', description: '全模型支持', enabled: true },
  { id: '3', name: '团队项目管理', description: '团队项目管理', enabled: true },
  { id: '4', name: '高级协作功能', description: '高级协作功能', enabled: true },
  { id: '5', name: '优先技术支持', description: '优先技术支持', enabled: true },
  { id: '6', name: '高级数据分析', description: '高级数据分析', enabled: true },
  { id: '7', name: '无限API调用', description: '无限API调用', enabled: true },
]

const CreatePlanPage = () => {
  const t = useTranslations('admin.planManagement')
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()
  const [selectedFeatures, setSelectedFeatures] = useState(DEFAULT_FEATURES)

  const handleFinish = async (values: any) => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/vip/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          price: String(values.price),
          originalPrice: values.originalPrice ? String(values.originalPrice) : undefined,
          status: values.isActive, // 映射到数据库的status字段
          features: selectedFeatures,
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('messages.createFailed'))
      }
      message.success(t('messages.createSuccess'))
      router.push('/admin/vip/plans')
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev =>
      prev.map(feature =>
        feature.id === featureId
          ? { ...feature, enabled: !feature.enabled }
          : feature,
      ),
    )
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: 24,
        padding: '16px 0',
        borderBottom: '1px solid #f0f0f0',
      }}>
        <Link href="/admin/vip/plans" style={{
          display: 'flex',
          alignItems: 'center',
          color: '#666',
          textDecoration: 'none',
          marginRight: 16,
        }}>
          <span style={{ fontSize: 18, marginRight: 8 }}>←</span>
          返回套餐列表
        </Link>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '24px 32px',
        borderRadius: 12,
        marginBottom: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>新建VIP套餐</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>设置套餐信息、价格和功能特性</p>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          isActive: true,
          sortOrder: 0,
          duration: 1,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* 左侧：基本信息 */}
          <div>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>基本信息</span>
                </div>
              }
              style={{
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0',
              }}
            >
              <Form.Item name="name" label="套餐名称" rules={[{ required: true, message: '请输入套餐名称' }]}>
                <Input
                  placeholder="例如：年度VIP套餐"
                  style={{ borderRadius: 6 }}
                />
              </Form.Item>

              <Form.Item name="description" label="套餐描述">
                <Input.TextArea
                  rows={3}
                  placeholder="套餐的详细描述"
                  style={{ borderRadius: 6 }}
                />
              </Form.Item>

              <Form.Item name="duration" label="时长（月）" rules={[{ required: true, message: '请输入时长' }]}>
                <InputNumber
                  min={1}
                  style={{ width: '100%', borderRadius: 6 }}
                  placeholder="例如：12"
                />
              </Form.Item>

              <Form.Item name="sortOrder" label="排序">
                <InputNumber
                  min={0}
                  style={{ width: '100%', borderRadius: 6 }}
                  placeholder="数字越小排序越靠前"
                />
              </Form.Item>
            </Card>

            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>价格信息</span>
                </div>
              }
              style={{
                marginTop: 16,
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0',
              }}
            >
              <Form.Item name="price" label="现价" rules={[{ required: true, message: '请输入价格' }]}>
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%', borderRadius: 6 }}
                  placeholder="例如：99.00"
                  addonBefore="¥"
                />
              </Form.Item>

              <Form.Item name="originalPrice" label="原价">
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%', borderRadius: 6 }}
                  placeholder="例如：199.00（可选，用于显示折扣）"
                  addonBefore="¥"
                />
              </Form.Item>
            </Card>

            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>状态设置</span>
                </div>
              }
              style={{
                marginTop: 16,
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0',
              }}
            >
              <Form.Item name="isActive" label="是否启用" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Card>
          </div>

          {/* 右侧：功能特性 */}
          <div>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>功能特性</span>
                  <span style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: '#666',
                    fontWeight: 400,
                  }}>
                    ({selectedFeatures.filter(f => f.enabled).length}/{selectedFeatures.length})
                  </span>
                </div>
              }
              style={{
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                {selectedFeatures.map(feature => (
                  <div
                    key={feature.id}
                    style={{
                      border: `2px solid ${feature.enabled ? '#52c41a' : '#f0f0f0'}`,
                      borderRadius: 8,
                      padding: 16,
                      cursor: 'pointer',
                      backgroundColor: feature.enabled ? '#f6ffed' : '#fafafa',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onClick={() => toggleFeature(feature.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {feature.enabled && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: 0,
                        height: 0,
                        borderStyle: 'solid',
                        borderWidth: '0 20px 20px 0',
                        borderColor: 'transparent #52c41a transparent transparent',
                      }} />
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <strong style={{ color: feature.enabled ? '#52c41a' : '#333' }}>
                        {feature.name}
                      </strong>
                      <Switch
                        checked={feature.enabled}
                        style={{ backgroundColor: feature.enabled ? '#52c41a' : undefined }}
                      />
                    </div>
                    <div style={{ color: '#666', fontSize: 13, lineHeight: 1.4 }}>
                      {feature.description}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div style={{
          marginTop: 32,
          padding: '24px 0',
          borderTop: '1px solid #f0f0f0',
          textAlign: 'center',
        }}>
          <Space size="large">
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              size="large"
              style={{
                padding: '8px 32px',
                height: 40,
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              新建
            </Button>
            <Button
              onClick={() => router.push('/admin/vip/plans')}
              size="large"
              style={{
                padding: '8px 32px',
                height: 40,
                borderRadius: 6,
                fontSize: 14,
              }}
            >
              取消
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  )
}

export default withPagePermission(CreatePlanPage, {
  permission: 'plan.create'
})
