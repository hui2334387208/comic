'use client'

import { ArrowLeftOutlined } from '@ant-design/icons'
import { Card, Form, InputNumber, Select, DatePicker, Button, message, Spin, Input } from 'antd'
import dayjs from 'dayjs'
import { useRouter, useParams } from 'next/navigation'
import React, { useState, useEffect } from 'react'

import { withPagePermission } from '@/lib/withPagePermission'

interface RedeemCode {
  id: number
  code: string
  credits: number
  maxUses: number
  usedCount: number
  status: string
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

const EditRedeemCodePage = () => {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [code, setCode] = useState<RedeemCode | null>(null)

  useEffect(() => {
    fetchCode()
  }, [id])

  const fetchCode = async () => {
    setFetching(true)
    try {
      const response = await fetch(`/api/admin/credits/redeem-codes/${id}`)
      if (!response.ok) {
        throw new Error('获取兑换码信息失败')
      }
      const data = await response.json()
      setCode(data)
      form.setFieldsValue({
        code: data.code,
        credits: data.credits,
        maxUses: data.maxUses,
        usedCount: data.usedCount,
        status: data.status,
        expiresAt: data.expiresAt ? dayjs(data.expiresAt) : null,
      })
    } catch (err: any) {
      message.error(err.message)
      router.back()
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/credits/redeem-codes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          expiresAt: values.expiresAt ? values.expiresAt.toISOString() : null,
        }),
      })

      if (!response.ok) {
        const res = await response.json()
        throw new Error(res.error || '更新失败')
      }

      message.success('更新成功')
      router.push('/admin/credits/redeem-codes')
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '24px 32px',
          borderRadius: 12,
          marginBottom: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>编辑兑换码</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
          编辑兑换码信息
        </p>
      </div>

      <Card
        bordered={false}
        style={{
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          style={{ marginBottom: 24 }}
        >
          返回列表
        </Button>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            label="兑换码"
            name="code"
            rules={[
              { required: true, message: '请输入兑换码' },
              { pattern: /^[A-Z0-9]+$/, message: '只能包含大写字母和数字' },
              { min: 6, message: '至少6个字符' },
              { max: 50, message: '最多50个字符' },
            ]}
            extra="只能包含大写字母和数字，6-50个字符"
          >
            <Input 
              placeholder="例如：CREDIT2024" 
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>

          <Form.Item
            label="次数"
            name="credits"
            rules={[{ required: true, message: '请输入次数' }]}
            extra="用户兑换后可获得的次数"
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="最大使用次数"
            name="maxUses"
            rules={[{ required: true, message: '请输入最大使用次数' }]}
            extra="该兑换码可以被使用的次数"
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="已使用次数"
            name="usedCount"
            rules={[{ required: true, message: '请输入已使用次数' }]}
            extra="当前已被使用的次数"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Select.Option value="active">可用</Select.Option>
              <Select.Option value="inactive">未激活</Select.Option>
              <Select.Option value="expired">已过期</Select.Option>
              <Select.Option value="used_up">已用完</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="过期时间"
            name="expiresAt"
            extra="不设置则永久有效"
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="选择过期时间"
              format="YYYY-MM-DD HH:mm"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              保存修改
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => router.back()}
              size="large"
            >
              取消
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default withPagePermission(EditRedeemCodePage, {
  permission: 'credits-redeem.update',
})
