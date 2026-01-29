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
  Spin,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'

interface CoupletTag {
  id: number
  name: string
  slug: string
  color: string
  status: string
}

function EditCoupletTagPage() {
  const t = useTranslations('admin.coupletTags')
  const router = useRouter()
  const params = useParams()
  const [form] = Form.useForm()

  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [tag, setTag] = useState<CoupletTag | null>(null)

  const tagId = params.id as string

  useEffect(() => {
    if (tagId) {
      fetchTag()
    }
  }, [tagId])

  const fetchTag = async () => {
    try {
      const response = await fetch(`/api/admin/couplet-tags/${tagId}`)
      const result = await response.json()
      if (result.success) {
        setTag(result.data)
        form.setFieldsValue(result.data)
      } else {
        message.error('加载标签失败')
        router.push('/admin/couplets/tags')
      }
    } catch (error) {
      message.error('加载标签失败')
      router.push('/admin/couplets/tags')
    } finally {
      setPageLoading(false)
    }
  }

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/couplet-tags/${tagId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      const result = await response.json()

      if (result.success) {
        message.success('标签更新成功')
        router.push('/admin/couplets/tags')
      } else {
        message.error(result.error || '更新标签失败')
      }
    } catch (error) {
      message.error('更新标签失败')
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

  if (!tag) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2>标签未找到</h2>
          <Button onClick={() => router.push('/admin/couplets/tags')}>
            返回标签列表
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
          返回标签列表
        </Button>
        <h1 className="text-2xl font-bold">编辑标签: {tag.name}</h1>
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
                rules={[{ required: true, message: '请输入标签名称' }]}
              >
                <Input placeholder="输入标签名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="slug" label="别名">
                <Input placeholder="留空则自动生成" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
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
                更新标签
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

export default EditCoupletTagPage