'use client'

import React, { useState, useEffect } from 'react'
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
  Spin,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'

function EditComicCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const categoryId = params.id as string

  useEffect(() => {
    if (categoryId) {
      fetchCategory()
    }
  }, [categoryId])

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/admin/comics/categories/${categoryId}`)
      const result = await response.json()
      if (result.success) {
        form.setFieldsValue(result.data)
      } else {
        message.error('加载分类失败')
        router.push('/admin/comics/categories')
      }
    } catch (error) {
      message.error('加载分类失败')
      router.push('/admin/comics/categories')
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/comics/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      const result = await response.json()

      if (result.success) {
        message.success('分类更新成功')
        router.push('/admin/comics/categories')
      } else {
        message.error(result.error || '更新分类失败')
      }
    } catch (error) {
      message.error('更新分类失败')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    )
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
        <h1 className="text-2xl font-bold">编辑漫画分类</h1>
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
                    保存更改
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

export default EditComicCategoryPage
