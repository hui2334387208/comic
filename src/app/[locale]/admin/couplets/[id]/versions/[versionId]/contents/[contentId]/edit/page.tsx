'use client'

import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Space,
  Typography,
  Descriptions,
  Spin,
  InputNumber,
  Row,
  Col,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'

const { Title } = Typography
const { TextArea } = Input

interface CoupletVersionInfo {
  couplet: {
    id: number
    title: string
    slug: string
    description: string
    status: string
    createdAt: string
  }
  version: {
    id: number
    coupletId: number
    version: number
    versionDescription: string
    isLatestVersion: boolean
    createdAt: string
  }
}

interface CoupletContentItem {
  id: number
  upperLine: string
  lowerLine: string
  horizontalScroll: string
  appreciation: string
  orderIndex: number
  createdAt: string
}

function EditCoupletContentPage() {
  const t = useTranslations('admin.coupletContents')
  const router = useRouter()
  const params = useParams()
  const [form] = Form.useForm()

  const [versionInfo, setVersionInfo] = useState<CoupletVersionInfo | null>(null)
  const [content, setContent] = useState<CoupletContentItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const coupletId = params.id as string
  const versionId = params.versionId as string
  const contentId = params.contentId as string

  useEffect(() => {
    if (coupletId && versionId && contentId) {
      fetchData()
    }
  }, [coupletId, versionId, contentId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [versionRes, contentRes] = await Promise.all([
        fetch(`/api/admin/couplets/${coupletId}/versions/${versionId}`),
        fetch(`/api/admin/couplets/${coupletId}/versions/${versionId}/contents/${contentId}`),
      ])

      const versionData = await versionRes.json()
      const contentData = await contentRes.json()

      if (versionData.success) {
        setVersionInfo(versionData.data)
      } else {
        message.error('加载版本信息失败')
        router.push(`/admin/couplets/${coupletId}/versions/${versionId}/contents`)
        return
      }

      if (contentData.success) {
        setContent(contentData.data)
        form.setFieldsValue(contentData.data)
      } else {
        message.error('加载内容失败')
        router.push(`/admin/couplets/${coupletId}/versions/${versionId}/contents`)
        return
      }
    } catch (error) {
      message.error('加载数据失败')
      router.push(`/admin/couplets/${coupletId}/versions/${versionId}/contents`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: any) => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/couplets/${coupletId}/versions/${versionId}/contents/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      const result = await response.json()

      if (result.success) {
        message.success('内容更新成功')
        router.push(`/admin/couplets/${coupletId}/versions/${versionId}/contents`)
      } else {
        message.error(result.error || '更新内容失败')
      }
    } catch (error) {
      message.error('更新内容失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  if (!content || !versionInfo) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2>内容未找到</h2>
          <Button onClick={() => router.push(`/admin/couplets/${coupletId}/versions/${versionId}/contents`)}>
            返回内容列表
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
          onClick={() => router.push(`/admin/couplets/${coupletId}/versions/${versionId}/contents`)}
          className="mb-4"
        >
          返回内容列表
        </Button>
        <Title level={2}>编辑内容</Title>
      </div>

      <Card title="版本信息" className="mb-6">
        <Row gutter={24}>
          <Col span={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="对联">
                {versionInfo.couplet.title}
              </Descriptions.Item>
              <Descriptions.Item label="版本">
                v{versionInfo.version.version}
                {versionInfo.version.isLatestVersion && ' (最新)'}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="状态">
                {versionInfo.couplet.status === 'published' ? '已发布' : versionInfo.couplet.status === 'draft' ? '草稿' : '已归档'}
              </Descriptions.Item>
              <Descriptions.Item label="内容创建时间">
                {new Date(content.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      <Card title="内容详情">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="upperLine"
                label="上联"
                rules={[{ required: true, message: '请输入上联' }]}
              >
                <Input placeholder="输入上联" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lowerLine"
                label="下联"
                rules={[{ required: true, message: '请输入下联' }]}
              >
                <Input placeholder="输入下联" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="horizontalScroll" label="横批">
            <Input placeholder="输入横批" />
          </Form.Item>

          <Form.Item name="appreciation" label="赏析">
            <TextArea
              rows={8}
              placeholder="输入对联的赏析和分析"
            />
          </Form.Item>

          <Form.Item name="orderIndex" label="排序索引">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={<SaveOutlined />}
                size="large"
              >
                更新内容
              </Button>
              <Button
                onClick={() => router.push(`/admin/couplets/${coupletId}/versions/${versionId}/contents`)}
                size="large"
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

export default EditCoupletContentPage