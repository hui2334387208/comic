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
  InputNumber,
  Row,
  Col,
  Spin,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'

const { TextArea } = Input

interface CoupletCategory {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  color: string
  status: string
  sortOrder: number
}

function EditCoupletCategoryPage() {
  const t = useTranslations('admin.coupletCategories')
  const router = useRouter()
  const params = useParams()
  const [form] = Form.useForm()

  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [category, setCategory] = useState<CoupletCategory | null>(null)

  const categoryId = params.id as string

  useEffect(() => {
    if (categoryId) {
      fetchCategory()
    }
  }, [categoryId])

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/admin/couplet-categories/${categoryId}`)
      const result = await response.json()
      if (result.success) {
        setCategory(result.data)
        form.setFieldsValue(result.data)
      } else {
        message.error('加载分类失败')
        router.push('/admin/couplets/categories')
      }
    } catch (error) {
      message.error('加载分类失败')
      router.push('/admin/couplets/categories')
    } finally {
      setPageLoading(false)
    }
  }

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/couplet-categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      const result = await response.json()

      if (result.success) {
        message.success('分类更新成功')
        router.push('/admin/couplets/categories')
      } else {
        message.error(result.error || '更新分类失败')
      }
    } catch (error) {
      message.error('更新分类失败')
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  if (!category) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2>分类未找到</h2>
          <Button onClick={() => router.push('/admin/couplets/categories')}>
            返回分类列表
          </Button>
        </div>
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
        <h1 className="text-2xl font-bold">编辑分类: {category.name}</h1>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="名称"
                rules={[{ required: true, message: '请输入分类名称' }]}
              >
                <Input placeholder="输入分类名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="slug" label="别名">
                <Input placeholder="留空则自动生成" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="输入分类描述" />
          </Form.Item>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item name="icon" label="图标">
                <Input placeholder="输入表情图标" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="color" label="颜色">
                <Input type="color" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sortOrder" label="排序">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">禁用</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
              >
                更新分类
              </Button>
              <Button onClick={() => router.back()}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default EditCoupletCategoryPage