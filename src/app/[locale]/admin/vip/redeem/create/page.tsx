'use client'

import {
  Card,
  Typography,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Row,
  Col,
  message,
  Space,
} from 'antd'
import dayjs from 'dayjs'
import { omitBy } from 'lodash'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useState, useEffect, useCallback } from 'react'

import { useRouter } from '@/i18n/navigation'
import { withPagePermission } from '@/lib/withPagePermission'

const { Title } = Typography
const { Option } = Select

interface VipPlan {
  id: number;
  name: string;
  status?: boolean;
}

function generateCode(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function CreateRedeemCodePage() {
  const t = useTranslations('admin')
  const router = useRouter()
  const [plans, setPlans] = useState<VipPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [form] = Form.useForm()

  // 兑换类型和状态选项放到组件内部，确保可以访问t
  const redeemTypes = [
    { value: 'plan', label: t('vip.redeem.typeOptions.plan') },
    { value: 'duration', label: t('vip.redeem.typeOptions.duration') },
    { value: 'days', label: t('vip.redeem.typeOptions.days') },
    { value: 'level', label: t('vip.redeem.typeOptions.level') },
  ]
  const statusOptions = [
    { value: 'active', label: t('vip.redeem.statusOptions.active') },
    { value: 'inactive', label: t('vip.redeem.statusOptions.inactive') },
    { value: 'expired', label: t('vip.redeem.statusOptions.expired') },
    { value: 'used_up', label: t('vip.redeem.statusOptions.used_up') },
    { value: 'deleted', label: t('vip.redeem.statusOptions.deleted') },
  ]

  const fetchPlans = useCallback(async () => {
    setLoadingPlans(true)
    try {
      const response = await fetch('/api/admin/vip/plans')
      if (!response.ok) throw new Error('Failed to fetch plans')
      const plansData: VipPlan[] = await response.json()
      setPlans(Array.isArray(plansData) ? plansData.filter((p) => p.status === true) : [])
    } catch (error) {
      message.error('Failed to fetch VIP plans')
    } finally {
      setLoadingPlans(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
    form.setFieldsValue({ code: generateCode() })
  }, [fetchPlans, form])

  const handleCreate = async (values: any) => {
    setLoading(true)
    try {
      if (values.expiresAt) {
        values.expiresAt = values.expiresAt.toISOString()
      }

      // 用lodash过滤掉为null的字段
      const filteredValues = omitBy(values, v => v === null)

      const response = await fetch('/api/admin/vip/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filteredValues),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t('vip.redeem.createFailed'))
      }
      message.success(t('vip.redeem.createSuccess'))
      router.push('/admin/vip/redeem')
    } catch (error: any) {
      message.error(error?.message || t('vip.redeem.createFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* 返回链接 */}
      <div style={{
        display: 'flex', alignItems: 'center', marginBottom: 24, padding: '16px 0', borderBottom: '1px solid #f0f0f0',
      }}>
        <Link href="/admin/vip/redeem" style={{ display: 'flex', alignItems: 'center', color: '#666', textDecoration: 'none', marginRight: 16 }}>
          <span style={{ fontSize: 18, marginRight: 8 }}>←</span>
          {t('vip.redeem.backToList')}
        </Link>
      </div>

      {/* 顶部渐变标题 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '24px 32px',
        borderRadius: 12,
        marginBottom: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>{t('vip.redeem.createModalTitle')}</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>{t('vip.redeem.createDescription')}</p>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleCreate}
        initialValues={{ status: 'active', maxUses: 1 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* 左侧：基本信息 */}
          <div>
            <Card
              title={<span style={{ fontSize: 16, fontWeight: 600 }}>{t('vip.redeem.basicInfo')}</span>}
              style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}
            >
              <Form.Item
                name="code"
                label={t('vip.redeem.code')}
                rules={[{ required: true, message: t('vip.redeem.code') }]}
              >
                <Input placeholder={t('vip.redeem.code')} maxLength={50} style={{ borderRadius: 6 }} />
              </Form.Item>
              <Button
                onClick={() => form.setFieldsValue({ code: generateCode() })}
                style={{ width: '100%', marginBottom: 16, borderRadius: 6 }}
              >
                {t('vip.redeem.generateRandom')}
              </Button>
              <Form.Item
                name="type"
                label={t('vip.redeem.type')}
                rules={[{ required: true, message: t('vip.redeem.type') }]}
              >
                <Select
                  placeholder={t('vip.redeem.type')}
                  style={{ borderRadius: 6 }}
                  onChange={(value) => {
                    if (value === 'plan') {
                      form.setFieldsValue({ planId: null, duration: null, days: null, vipLevel: null })
                    } else if (value === 'duration') {
                      form.setFieldsValue({ planId: null, duration: null, days: null, vipLevel: null })
                    } else if (value === 'days') {
                      form.setFieldsValue({ planId: null, duration: null, days: null, vipLevel: null })
                    } else if (value === 'level') {
                      form.setFieldsValue({ planId: null, duration: null, days: null, vipLevel: null })
                    }
                  }}
                >
                  {redeemTypes.map((type) => (
                    <Option key={type.value} value={type.value}>{type.label}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="planId"
                label={t('vip.plan.name')}
                rules={[]}
              >
                <Select
                  placeholder={t('vip.redeem.planPlaceholder')}
                  loading={loadingPlans}
                  allowClear
                  showSearch
                  style={{ borderRadius: 6 }}
                  filterOption={(input, option) => {
                    const label = String(option?.children ?? '')
                    return label.toLowerCase().includes(input.toLowerCase())
                  }}
                >
                  {plans.map((plan: VipPlan) => (
                    <Option key={plan.id} value={plan.id}>{plan.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Card>
          </div>

          {/* 右侧：兑换设置 */}
          <div>
            <Card
              title={<span style={{ fontSize: 16, fontWeight: 600 }}>{t('vip.redeem.redeemSettings')}</span>}
              style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="duration" label={t('vip.redeem.duration')}>
                    <InputNumber min={1} max={120} style={{ width: '100%', borderRadius: 6 }} placeholder="可选" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="days" label={t('vip.redeem.days')}>
                    <InputNumber min={1} max={3650} style={{ width: '100%', borderRadius: 6 }} placeholder="可选" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="vipLevel" label={t('vip.redeem.vipLevel')}>
                    <InputNumber min={1} max={10} style={{ width: '100%', borderRadius: 6 }} placeholder="可选" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="maxUses"
                    label={t('vip.redeem.maxUses')}
                    rules={[{ required: true, message: t('vip.redeem.maxUses') }]}
                  >
                    <InputNumber min={1} max={10000} style={{ width: '100%', borderRadius: 6 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="expiresAt" label={t('vip.redeem.expiresAt')}>
                    <DatePicker
                      style={{ width: '100%', borderRadius: 6 }}
                      showTime
                      format="YYYY-MM-DD HH:mm:ss"
                      disabledDate={(current) => current && current < dayjs().startOf('day')}
                      placeholder="可选"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="status"
                label={t('vip.redeem.status')}
                rules={[{ required: true, message: t('vip.redeem.status') }]}
              >
                <Select style={{ borderRadius: 6 }}>
                  {statusOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Card>
          </div>
        </div>

        {/* 底部操作区 */}
        <div style={{ marginTop: 32, padding: '24px 0', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
          <Space size="large">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              style={{ padding: '8px 32px', height: 40, borderRadius: 6, fontSize: 14, fontWeight: 500 }}
            >
              {t('vip.redeem.new')}
            </Button>
            <Button
              onClick={() => router.push('/admin/vip/redeem')}
              size="large"
              style={{ padding: '8px 32px', height: 40, borderRadius: 6, fontSize: 14 }}
            >
              {t('vip.redeem.cancel')}
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  )
}

export default withPagePermission(CreateRedeemCodePage, {
  permission: 'redeem.create'
})
