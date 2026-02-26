'use client'

import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { Card, Form, InputNumber, Select, DatePicker, Button, message, Input } from 'antd'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'

import { withPagePermission } from '@/lib/withPagePermission'

const CreateRedeemCodePage = () => {
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // 生成随机兑换码
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  // 初始化时设置随机兑换码
  useEffect(() => {
    form.setFieldsValue({
      code: generateRandomCode(),
    })
  }, [])

  // 重新生成兑换码
  const handleRegenerateCode = () => {
    form.setFieldsValue({
      code: generateRandomCode(),
    })
  }

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/credits/redeem-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          expiresAt: values.expiresAt ? values.expiresAt.toISOString() : undefined,
        }),
      })

      if (!response.ok) {
        const res = await response.json()
        throw new Error(res.error || '创建失败')
      }

      const newCode = await response.json()
      message.success('创建成功')
      router.push('/admin/credits/redeem-codes')
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setLoading(false)
    }
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
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>创建次数兑换码</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>手动创建单个兑换码</p>
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
          initialValues={{
            credits: 10,
            maxUses: 1,
            status: 'active',
          }}
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
            extra="系统自动生成，点击刷新按钮可重新生成"
          >
            <Input 
              placeholder="例如：CREDIT2024" 
              style={{ textTransform: 'uppercase' }}
              disabled
              addonAfter={
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={handleRegenerateCode}
                  size="small"
                >
                  重新生成
                </Button>
              }
            />
          </Form.Item>

          <Form.Item
            label="次数"
            name="credits"
            rules={[{ required: true, message: '请输入次数' }]}
            extra="用户兑换后可获得的次数"
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="例如：10" />
          </Form.Item>

          <Form.Item
            label="最大使用次数"
            name="maxUses"
            rules={[{ required: true, message: '请输入最大使用次数' }]}
            extra="该兑换码可以被使用的次数"
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="例如：1" />
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
              创建兑换码
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

export default withPagePermission(CreateRedeemCodePage, {
  permission: 'credits-redeem.create',
})
