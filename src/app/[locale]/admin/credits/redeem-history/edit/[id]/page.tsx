'use client'

import { ArrowLeftOutlined } from '@ant-design/icons'
import { Card, Form, Select, Input, Button, message, Spin } from 'antd'
import { useRouter, useParams } from 'next/navigation'
import React, { useState, useEffect } from 'react'

import { withPagePermission } from '@/lib/withPagePermission'

interface RedeemHistoryDetail {
  id: number
  status: string
  message: string | null
  credits: number
  redeemedAt: string
  user: {
    id: string
    name: string | null
    email: string | null
  }
  redeemCode: {
    code: string
    credits: number
  }
}

const EditRedeemHistoryPage = () => {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [record, setRecord] = useState<RedeemHistoryDetail | null>(null)

  useEffect(() => {
    fetchRecord()
  }, [id])

  const fetchRecord = async () => {
    setFetching(true)
    try {
      const response = await fetch(`/api/admin/credits/redeem-history/${id}`)
      if (!response.ok) {
        throw new Error('获取记录信息失败')
      }
      const data = await response.json()
      setRecord(data)
      form.setFieldsValue({
        status: data.status,
        message: data.message,
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
      const response = await fetch(`/api/admin/credits/redeem-history/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const res = await response.json()
        throw new Error(res.error || '更新失败')
      }

      message.success('更新成功')
      router.push('/admin/credits/redeem-history')
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

  if (!record) {
    return null
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
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>编辑兑换记录</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>修改兑换记录的状态和备注</p>
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

        <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>记录信息</h3>
          <p><strong>兑换码：</strong>{record.redeemCode.code}</p>
          <p><strong>用户：</strong>{record.user.name || '未知用户'} ({record.user.email})</p>
          <p><strong>次数：</strong>{record.credits} 次</p>
          <p><strong>兑换时间：</strong>{new Date(record.redeemedAt).toLocaleString('zh-CN')}</p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Select.Option value="success">成功</Select.Option>
              <Select.Option value="failed">失败</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="备注信息"
            name="message"
          >
            <Input.TextArea
              rows={4}
              placeholder="输入备注信息（可选）"
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

export default withPagePermission(EditRedeemHistoryPage, {
  permission: 'credits-history.update',
})
