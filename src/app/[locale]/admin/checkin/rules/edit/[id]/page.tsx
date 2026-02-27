'use client'

import { useState, useEffect } from 'react'
import { Form, Input, InputNumber, Button, Card, message, Select, Spin, Space } from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
import { withPagePermission } from '@/lib/withPagePermission'

const { TextArea } = Input

function EditCheckInRulePage() {
  const router = useRouter()
  const params = useParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchRule()
  }, [])

  const fetchRule = async () => {
    setFetching(true)
    try {
      const res = await fetch(`/api/admin/checkin/rules/${params.id}`)
      const data = await res.json()

      if (data.success) {
        form.setFieldsValue(data.data)
      } else {
        message.error(data.error || '获取规则详情失败')
        router.back()
      }
    } catch (error) {
      console.error('获取规则详情失败:', error)
      message.error('获取规则详情失败')
      router.back()
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/checkin/rules/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()

      if (data.success) {
        message.success('签到规则更新成功')
        router.push('/admin/checkin/rules')
      } else {
        message.error(data.error || '更新失败')
      }
    } catch (error) {
      console.error('更新失败:', error)
      message.error('更新失败')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px' 
      }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '24px 32px',
        borderRadius: 12,
        marginBottom: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
            }}
          >
            返回
          </Button>
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>编辑签到规则</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>修改签到奖励规则配置</p>
      </div>

      <Card
        bordered={false}
        style={{
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="规则名称"
            name="name"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="例如：每日签到、连续3天签到" size="large" />
          </Form.Item>

          <Form.Item
            label="连续签到天数"
            name="consecutiveDays"
            rules={[{ required: true, message: '请输入连续签到天数' }]}
            extra="用户需要连续签到多少天才能获得此奖励"
          >
            <InputNumber
              min={1}
              max={365}
              placeholder="输入天数"
              size="large"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="奖励积分"
            name="points"
            rules={[{ required: true, message: '请输入奖励积分' }]}
            extra="用户签到后将获得的积分数量"
          >
            <InputNumber
              min={1}
              max={10000}
              placeholder="输入积分数量"
              size="large"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="规则描述"
            name="description"
            extra="可选，对此规则的详细说明"
          >
            <TextArea
              rows={4}
              placeholder="输入规则描述"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="排序"
            name="sortOrder"
            extra="数字越小越靠前"
          >
            <InputNumber
              min={0}
              max={9999}
              placeholder="输入排序值"
              size="large"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select size="large">
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
                style={{
                  height: 40,
                  borderRadius: 6,
                  fontSize: 14,
                }}
              >
                保存修改
              </Button>
              <Button 
                onClick={() => router.back()} 
                size="large"
                style={{
                  height: 40,
                  borderRadius: 6,
                  fontSize: 14,
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default withPagePermission(EditCheckInRulePage, 'checkin-rule.update')
