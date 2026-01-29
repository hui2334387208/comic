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
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'

const { Title } = Typography
const { TextArea } = Input

interface CoupletSummary {
  id: number
  title: string
  slug: string
  description: string
  status: string
  createdAt: string
}

interface CoupletVersionOption {
  id: number
  version: number
  versionDescription: string
  isLatestVersion: boolean
}

function CreateCoupletVersionPage() {
  const t = useTranslations('admin.coupletVersions')
  const router = useRouter()
  const params = useParams()
  const [form] = Form.useForm()

  const [couplet, setCouplet] = useState<CoupletSummary | null>(null)
  const [versions, setVersions] = useState<CoupletVersionOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const coupletId = params.id as string

  useEffect(() => {
    if (coupletId) {
      fetchData()
    }
  }, [coupletId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [coupletRes, versionsRes] = await Promise.all([
        fetch(`/api/admin/couplets/${coupletId}`),
        fetch(`/api/admin/couplets/${coupletId}/versions`),
      ])

      const coupletData = await coupletRes.json()
      const versionsData = await versionsRes.json()

      if (coupletData.success) {
        setCouplet(coupletData.data)
      } else {
        message.error('加载对联失败')
        router.push('/admin/couplets')
        return
      }

      if (versionsData.success) {
        setVersions(versionsData.data.items || [])
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
      const response = await fetch(`/api/admin/couplets/${coupletId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      const result = await response.json()

      if (result.success) {
        message.success('版本创建成功')
        router.push(`/admin/couplets/${coupletId}/versions`)
      } else {
        message.error(result.error || '创建版本失败')
      }
    } catch (error) {
      message.error('创建版本失败')
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
        <Title level={2}>创建新版本</Title>
      </div>

      {couplet && (
        <Card title="对联信息" className="mb-6">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="标题">
              {couplet.title}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {couplet.status === 'published' ? '已发布' : couplet.status === 'draft' ? '草稿' : '已归档'}
            </Descriptions.Item>
            <Descriptions.Item label="别名">
              {couplet.slug}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(couplet.createdAt).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
          {couplet.description && (
            <div className="mt-4">
              <strong>描述:</strong>
              <p className="mt-2 text-gray-600">{couplet.description}</p>
            </div>
          )}
        </Card>
      )}

      <Card title="版本详情">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            isLatestVersion: false,
          }}
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

          <Form.Item name="parentVersionId" label="父版本">
            <Select
              placeholder="选择父版本（可选）"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {versions.map(version => (
                <Select.Option key={version.id} value={version.id}>
                  v{version.version} - {version.versionDescription}
                  {version.isLatestVersion && ' (最新)'}
                </Select.Option>
              ))}
            </Select>
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
                创建版本
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

export default CreateCoupletVersionPage