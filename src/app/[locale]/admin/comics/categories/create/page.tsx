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
  InputNumber,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'

function CreateComicCategoryPage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/comics/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      const result = await response.json()

      if (result.success) {
        message.success('分类创建成功')
        router.push('/admin/comics/categories')
      } else {
        message.error(result.error || '创建分类失败')
      }
    } catch (error) {
      message.error('创建分类失败')
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
          返回分类列表
        </Button>
        <h1 className="text-2xl font-bold">创建漫画分类</h1>
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
                sortOrder: 0,
                icon: '📚',
                color: '#1890ff',
              }}
            >
              <Form.Item
                name="name"
                label="名称"
                rules={[{ required: true, message: '请输入分类名称' }]}
              >
                <Input placeholder="输入分类名称" size="large" />
              </Form.Item>

              <Form.Item name="slug" label="别名">
                <Input placeholder="留空则自动生成" />
              </Form.Item>

              <Form.Item name="description" label="描述">
                <Input.TextArea rows={3} placeholder="输入分类描述" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="icon" label="图标">
                    <Input placeholder="输入表情图标" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="color" label="颜色">
                    <Input type="color" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="status" label="状态">
                    <Select>
                      <Select.Option value="active">启用</Select.Option>
                      <Select.Option value="inactive">禁用</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="sortOrder" label="排序">
                    <InputNumber min={0} style={{ width: '100%' }} />
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
                    创建分类
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

export default CreateComicCategoryPage
