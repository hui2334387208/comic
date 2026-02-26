'use client'

import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  message,
  Space,
  Row,
  Col,
  DatePicker,
  Switch,
  Spin,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
import dayjs from 'dayjs'
import { withPagePermission } from '@/lib/withPagePermission'

const { TextArea } = Input

interface Campaign {
  id: number
  name: string
  description?: string
  inviterReward: number
  inviteeReward: number
  requirementType: string
  isActive: boolean
  startDate?: string
  endDate?: string
  maxInvitesPerUser?: number
}

function EditCampaignPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const locale = params.locale as string
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCampaign()
  }, [id])

  const fetchCampaign = async () => {
    try {
      const res = await fetch('/api/admin/referral/campaigns')
      if (res.ok) {
        const data = await res.json()
        const campaign = data.campaigns.find((c: Campaign) => c.id === parseInt(id))
        
        if (campaign) {
          form.setFieldsValue({
            name: campaign.name,
            description: campaign.description || '',
            inviterReward: campaign.inviterReward,
            inviteeReward: campaign.inviteeReward,
            requirementType: campaign.requirementType,
            isActive: campaign.isActive,
            startDate: campaign.startDate ? dayjs(campaign.startDate) : null,
            endDate: campaign.endDate ? dayjs(campaign.endDate) : null,
            maxInvitesPerUser: campaign.maxInvitesPerUser || null,
          })
        } else {
          message.error('活动不存在')
          router.push(`/${locale}/admin/referral/campaigns`)
        }
      } else {
        message.error('获取活动失败')
      }
    } catch (error) {
      message.error('获取活动失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: any) => {
    setSubmitting(true)
    try {
      const payload = {
        ...values,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null,
      }

      const res = await fetch(`/api/admin/referral/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        message.success('更新成功')
        router.push(`/${locale}/admin/referral/campaigns`)
      } else {
        const data = await res.json()
        message.error(data.error || '更新失败')
      }
    } catch (error) {
      message.error('更新失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center" style={{ minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push(`/${locale}/admin/referral/campaigns`)}
          className="mb-4"
        >
          返回活动列表
        </Button>
        <h1 className="text-2xl font-bold">编辑邀请活动</h1>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                name="name"
                label="活动名称"
                rules={[{ required: true, message: '请输入活动名称' }]}
              >
                <Input placeholder="例如：春节邀请活动" size="large" />
              </Form.Item>

              <Form.Item name="description" label="活动描述">
                <TextArea 
                  rows={4} 
                  placeholder="描述活动的详细信息..."
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="inviterReward"
                    label="邀请人奖励（次数）"
                    rules={[{ required: true, message: '请输入邀请人奖励' }]}
                  >
                    <InputNumber 
                      min={0} 
                      style={{ width: '100%' }}
                      placeholder="邀请人完成任务后获得的奖励次数"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="inviteeReward"
                    label="被邀请人奖励（次数）"
                    rules={[{ required: true, message: '请输入被邀请人奖励' }]}
                  >
                    <InputNumber 
                      min={0} 
                      style={{ width: '100%' }}
                      placeholder="被邀请人完成任务后获得的奖励次数"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="requirementType"
                    label="任务类型"
                    rules={[{ required: true, message: '请选择任务类型' }]}
                  >
                    <Select>
                      <Select.Option value="register">注册即可</Select.Option>
                      <Select.Option value="verified_email">验证邮箱</Select.Option>
                      <Select.Option value="first_comic">首次创作</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="maxInvitesPerUser"
                    label="每人最多邀请数"
                  >
                    <InputNumber 
                      min={1} 
                      style={{ width: '100%' }}
                      placeholder="留空表示不限制"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="startDate" label="开始时间">
                    <DatePicker 
                      style={{ width: '100%' }}
                      placeholder="留空表示立即开始"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="endDate" label="结束时间">
                    <DatePicker 
                      style={{ width: '100%' }}
                      placeholder="留空表示无限期"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item 
                name="isActive" 
                label="是否激活"
                valuePropName="checked"
                extra="激活后其他活动将自动停用"
              >
                <Switch 
                  checkedChildren="激活" 
                  unCheckedChildren="停用"
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    icon={<SaveOutlined />}
                  >
                    更新活动
                  </Button>
                  <Button onClick={() => router.push(`/${locale}/admin/referral/campaigns`)}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default withPagePermission(EditCampaignPage, 'referral-campaign.update')
