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
  Switch,
  Typography,
  Descriptions,
  Spin,
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
    parentVersionId?: number
    versionDescription: string
    isLatestVersion: boolean
    originalCoupletId?: number
    createdAt: string
    updatedAt: string
  }
}

interface CoupletVersionOption {
  id: number
  version: number
  versionDescription: string
  isLatestVersion: boolean
}

function EditCoupletVersionPage() {
  const t = useTranslations('admin.coupletVersions')
  const router = useRouter()
  const params = useParams()
  const [form] = Form.useForm()

  const [versionInfo, setVersionInfo] = useState<CoupletVersionInfo | null>(null)
  const [versions, setVersions] = useState<CoupletVersionOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const coupletId = params.id as string
  const versionId = params.versionId as string

  useEffect(() => {
    if (coupletId && versionId) {
      fetchData()
    }
  }, [coupletId, versionId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [versionRes, versionsRes] = await Promise.all([
        fetch(`/api/admin/couplets/${coupletId}/versions/${versionId}`),
        fetch(`/api/admin/couplets/${coupletId}/versions`),
      ])

      const versionData = await versionRes.json()
      const versionsData = await versionsRes.json()

      if (versionData.success) {
        setVersionInfo(versionData.data)
        form.setFieldsValue({
          versionDescription: versionData.data.version.versionDescription,
          isLatestVersion: versionData.data.version.isLatestVersion,
        })
      } else {
        message.error('加载版本失败')
        router.push(`/admin/couplets/${coupletId}/versions`)
        return
      }

      if (versionsData.success) {
        // Filter out current version from parent options
        const otherVersions = versionsData.data.items.filter(
          (v: any) => v.id !== parseInt(versionId)
        )
        setVersions(otherVersions)
      }
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: any) => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/couplets/${coupletId}/versions/${versionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      const result = await response.json()

      if (result.success) {
        message.success('版本更新成功')
        router.push(`/admin/couplets/${coupletId}/versions`)
      } else {
        message.error(result.error || '更新版本失败')
      }
    } catch (error) {
      message.error('更新版本失败')
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

  if (!versionInfo) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2>版本未找到</h2>
          <Button onClick={() => router.push(`/admin/couplets/${coupletId}/versions`)}>
            返回版本列表
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
          onClick={() => router.push(`/admin/couplets/${coupletId}/versions`)}
          className="mb-4"
        >
          返回版本列表
        </Button>
        <Title level={2}>编辑版本 v{versionInfo.version.version}</Title>
      </div>

      <Card title="对联信息" className="mb-6">
        <Row gutter={24}>
          <Col span={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="标题">
                {versionInfo.couplet.title}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {versionInfo.couplet.status === 'published' ? '已发布' : versionInfo.couplet.status === 'draft' ? '草稿' : '已归档'}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="版本">
                v{versionInfo.version.version}
                {versionInfo.version.isLatestVersion && ' (最新)'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(versionInfo.version.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      <Card title="版本详情">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="versionDescription"
            label="版本描述"
            rules={[
              { required: true, message: '请输入版本描述' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="描述此版本的新增内容或变更"
            />
          </Form.Item>

          <Form.Item name="isLatestVersion" valuePropName="checked">
            <Switch /> 设为最新版本
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={<SaveOutlined />}
              >
                更新版本
              </Button>
              <Button
                onClick={() => router.push(`/admin/couplets/${coupletId}/versions`)}
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

export default EditCoupletVersionPage