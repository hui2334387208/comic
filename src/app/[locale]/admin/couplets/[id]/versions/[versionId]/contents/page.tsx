'use client'

import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Card,
  message,
  Typography,
  Descriptions,
  Row,
  Col,
  Popconfirm,
} from 'antd'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'

const { Title } = Typography

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

function CoupletVersionContentsPage() {
  const t = useTranslations('admin.coupletContents')
  const router = useRouter()
  const params = useParams()

  const [versionInfo, setVersionInfo] = useState<CoupletVersionInfo | null>(null)
  const [contents, setContents] = useState<CoupletContentItem[]>([])
  const [loading, setLoading] = useState(false)

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
      const [versionRes, contentsRes] = await Promise.all([
        fetch(`/api/admin/couplets/${coupletId}/versions/${versionId}`),
        fetch(`/api/admin/couplets/${coupletId}/versions/${versionId}/contents`),
      ])

      const versionData = await versionRes.json()
      const contentsData = await contentsRes.json()

      if (versionData.success) {
        setVersionInfo(versionData.data)
      } else {
        message.error('加载版本信息失败')
        router.push(`/admin/couplets/${coupletId}/versions`)
        return
      }

      if (contentsData.success) {
        setContents(contentsData.data.items || [])
      } else {
        message.error('加载内容列表失败')
      }
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    router.push(`/admin/couplets/${coupletId}/versions/${versionId}/contents/create`)
  }

  const handleEdit = (content: CoupletContentItem) => {
    router.push(`/admin/couplets/${coupletId}/versions/${versionId}/contents/${content.id}/edit`)
  }

  const handleDelete = async (contentId: number) => {
    try {
      const response = await fetch(
        `/api/admin/couplets/${coupletId}/versions/${versionId}/contents/${contentId}`,
        {
          method: 'DELETE',
        }
      )
      const result = await response.json()

      if (result.success) {
        message.success('内容删除成功')
        fetchData()
      } else {
        message.error(result.error || '删除内容失败')
      }
    } catch (error) {
      message.error('删除内容失败')
    }
  }

  const columns = [
    {
      title: '顺序',
      dataIndex: 'orderIndex',
      key: 'orderIndex',
      width: 80,
      render: (index: number) => index + 1,
    },
    {
      title: '上联',
      dataIndex: 'upperLine',
      key: 'upperLine',
      render: (text: string) => (
        <div className="font-medium text-red-800">{text || '-'}</div>
      ),
    },
    {
      title: '下联',
      dataIndex: 'lowerLine',
      key: 'lowerLine',
      render: (text: string) => (
        <div className="font-medium text-red-800">{text || '-'}</div>
      ),
    },
    {
      title: '横批',
      dataIndex: 'horizontalScroll',
      key: 'horizontalScroll',
      render: (text: string) => (
        <div className="font-medium text-orange-700">{text || '-'}</div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: CoupletContentItem) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个内容吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

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
        <Title level={2}>内容管理</Title>
        <p className="text-gray-600">
          管理此版本的内容
        </p>
      </div>

      {versionInfo && (
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
                <Descriptions.Item label="描述">
                  {versionInfo.version.versionDescription}
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col span={12}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="状态">
                  {versionInfo.couplet.status === 'published' ? '已发布' : versionInfo.couplet.status === 'draft' ? '草稿' : '已归档'}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {new Date(versionInfo.version.createdAt).toLocaleString()}
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        </Card>
      )}

      <Card
        title="内容列表"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            添加内容
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={contents}
          rowKey="id"
          loading={loading}
          pagination={false}
          expandable={{
            expandedRowRender: (record) => (
              <div className="p-4 bg-gray-50 rounded">
                <Title level={5}>赏析</Title>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {record.appreciation || '暂无赏析'}
                </p>
              </div>
            ),
            rowExpandable: (record) => !!record.appreciation,
          }}
        />
      </Card>
    </div>
  )
}

export default CoupletVersionContentsPage