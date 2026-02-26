'use client'

import React, { useState } from 'react'
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
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
import { withPagePermission } from '@/lib/withPagePermission'

const { TextArea } = Input

function CreateCampaignPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const payload = {
        ...values,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null,
      }

      const response = await fetch('/api/admin/referral/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (response.ok) {
        message.success('活动创建成功')
        router.push(`/${locale}/admin/referral/campaigns`)
      } else {
        message.error(result.error || '创建活动失败')
      }
    } catch (error) {
      message.error('创建活动失败')
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-2xl font-bold">创建邀请活动</h1>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                inviterReward: 3,
                inviteeReward: 1,
                requirementType: 'verified_email',
                isActive: false,
                maxInvitesPerUser: 3,
              }}
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
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    创建活动
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

export default withPagePermission(CreateCampaignPage, 'referral-campaign.create')
