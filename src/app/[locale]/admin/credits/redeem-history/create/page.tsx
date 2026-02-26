'use client'

import { ArrowLeftOutlined } from '@ant-design/icons'
import { Card, Form, InputNumber, Select, Input, Button, message } from 'antd'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'

import { withPagePermission } from '@/lib/withPagePermission'

interface RedeemCode {
  id: number
  code: string
  credits: number
}

interface User {
  id: string
  name: string | null
  email: string | null
}

const CreateRedeemHistoryPage = () => {
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [codes, setCodes] = useState<RedeemCode[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loadingCodes, setLoadingCodes] = useState(false)
  const [searchingUsers, setSearchingUsers] = useState(false)

  useEffect(() => {
    fetchCodes()
  }, [])

  const fetchCodes = async () => {
    try {
      setLoadingCodes(true)
      const response = await fetch('/api/admin/credits/redeem-codes?page=1&limit=100')
      if (response.ok) {
        const result = await response.json()
        setCodes(result.data)
      }
    } catch (error) {
      console.error('获取兑换码失败:', error)
    } finally {
      setLoadingCodes(false)
    }
  }

  const searchUsers = async (keyword: string) => {
    if (!keyword) {
      setUsers([])
      return
    }

    try {
      setSearchingUsers(true)
      const response = await fetch(`/api/admin/users/search?keyword=${encodeURIComponent(keyword)}`)
      if (response.ok) {
        const result = await response.json()
        setUsers(result.data || [])
      }
    } catch (error) {
      console.error('搜索用户失败:', error)
    } finally {
      setSearchingUsers(false)
    }
  }

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/credits/redeem-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const res = await response.json()
        throw new Error(res.error || '创建失败')
      }

      message.success('创建成功')
      router.push('/admin/credits/redeem-history')
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
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>新建兑换记录</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>手动创建兑换历史记录</p>
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
            status: 'success',
            credits: 10,
          }}
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            label="兑换码"
            name="codeId"
            rules={[{ required: true, message: '请选择兑换码' }]}
          >
            <Select
              placeholder="选择兑换码"
              loading={loadingCodes}
              showSearch
              optionFilterProp="children"
            >
              {codes.map(code => (
                <Select.Option key={code.id} value={code.id}>
                  {code.code} ({code.credits}次)
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="用户"
            name="userId"
            rules={[{ required: true, message: '请选择用户' }]}
          >
            <Select
              placeholder="搜索用户名或邮箱"
              showSearch
              loading={searchingUsers}
              onSearch={searchUsers}
              filterOption={false}
              notFoundContent={searchingUsers ? '搜索中...' : '请输入关键词搜索'}
            >
              {users.map(user => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name || '未知用户'} ({user.email})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="次数"
            name="credits"
            rules={[{ required: true, message: '请输入次数' }]}
            extra="用户获得的次数"
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="例如：10" />
          </Form.Item>

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
              创建记录
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

export default withPagePermission(CreateRedeemHistoryPage, {
  permission: 'credits-history.create',
})
