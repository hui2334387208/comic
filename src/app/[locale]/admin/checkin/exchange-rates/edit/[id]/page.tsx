'use client'

import { useState, useEffect } from 'react'
import { Form, Input, InputNumber, Button, Card, message, Select, Spin, Space } from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
import { withPagePermission } from '@/lib/withPagePermission'

const { TextArea } = Input

function EditExchangeRatePage() {
  const router = useRouter()
  const params = useParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchRate()
  }, [])

  const fetchRate = async () => {
    setFetching(true)
    try {
      const res = await fetch(`/api/admin/checkin/exchange-rates/${params.id}`)
      const data = await res.json()

      if (data.success) {
        form.setFieldsValue(data.data)
      } else {
        message.error(data.error || '获取配置详情失败')
        router.back()
      }
    } catch (error) {
      console.error('获取配置详情失败:', error)
      message.error('获取配置详情失败')
      router.back()
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/checkin/exchange-rates/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()

      if (data.success) {
        message.success('兑换比例更新成功')
        router.push('/admin/checkin/exchange-rates')
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
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>编辑兑换比例</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>修改积分兑换次数比例配置</p>
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
            label="配置名称"
            name="name"
            rules={[{ required: true, message: '请输入配置名称' }]}
          >
            <Input placeholder="例如：标准兑换、优惠兑换" size="large" />
          </Form.Item>

          <Form.Item
            label="所需积分"
            name="pointsRequired"
            rules={[{ required: true, message: '请输入所需积分' }]}
            extra="用户需要消费多少积分"
          >
            <InputNumber
              min={1}
              max={100000}
              placeholder="输入积分数量"
              size="large"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="获得次数"
            name="creditsReceived"
            rules={[{ required: true, message: '请输入获得次数' }]}
            extra="用户将获得多少次漫画生成次数"
          >
            <InputNumber
              min={1}
              max={10000}
              placeholder="输入次数"
              size="large"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="配置描述"
            name="description"
            extra="可选，对此配置的详细说明"
          >
            <TextArea
              rows={4}
              placeholder="输入配置描述"
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


export default withPagePermission(EditExchangeRatePage, 'exchange-rate.update')
