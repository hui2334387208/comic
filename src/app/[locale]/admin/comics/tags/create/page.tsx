'use client'

import React, { useState } from 'react'
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  message,
  Space,
  Row,
  Col,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { withPagePermission } from '@/lib/withPagePermission'

function CreateComicTagPage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/comics/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      const result = await response.json()

      if (result.success) {
        message.success('标签创建成功')
        router.push('/admin/comics/tags')
      } else {
        message.error(result.error || '创建标签失败')
      }
    } catch (error) {
      message.error('创建标签失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          className="mb-4"
        >
          返回标签列表
        </Button>
        <h1 className="text-2xl font-bold">创建漫画标签</h1>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                status: 'active',
                color: '#1890ff',
              }}
            >
              <Form.Item
                name="name"
                label="名称"
                rules={[{ required: true, message: '请输入标签名称' }]}
              >
                <Input placeholder="输入标签名称" size="large" />
              </Form.Item>

              <Form.Item name="slug" label="别名">
                <Input placeholder="留空则自动生成" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="color" label="颜色">
                    <Input type="color" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="status" label="状态">
                    <Select>
                      <Select.Option value="active">启用</Select.Option>
                      <Select.Option value="inactive">禁用</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    创建标签
                  </Button>
                  <Button onClick={() => router.back()}>取消</Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default withPagePermission(CreateComicTagPage, {
  permission: 'comic-tag.create'
})
