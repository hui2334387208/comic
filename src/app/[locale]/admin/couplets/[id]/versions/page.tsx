'use client'

import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Card,
  message,
  Tag,
  Popconfirm,
  Typography,
  Descriptions,
  Row,
  Col,
} from 'antd'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'

const { Title } = Typography

interface CoupletSummary {
  id: number
  title: string
  slug: string
  description: string
  status: string
  createdAt: string
}

interface CoupletVersionItem {
  id: number
  coupletId: number
  version: number
  parentVersionId?: number
  versionDescription: string
  isLatestVersion: boolean
  originalCoupletId?: number
  contentCount: number
  createdAt: string
  updatedAt: string
}

function CoupletVersionsPage() {
  const t = useTranslations('admin.coupletVersions')
  const router = useRouter()
  const params = useParams()

  const [couplet, setCouplet] = useState<CoupletSummary | null>(null)
  const [versions, setVersions] = useState<CoupletVersionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [settingLatestId, setSettingLatestId] = useState<number | null>(null)

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
      } else {
        message.error('加载版本列表失败')
      }
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSetLatest = async (versionId: number) => {
    setSettingLatestId(versionId)
    try {
      const response = await fetch(
        `/api/admin/couplets/${coupletId}/versions/${versionId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isLatestVersion: true }),
        }
      )
      const result = await response.json()

      if (result.success) {
        message.success('最新版本更新成功')
        fetchData()
      } else {
        message.error(result.error || '更新最新版本失败')
      }
    } catch (error) {
      message.error('更新最新版本失败')
    } finally {
      setSettingLatestId(null)
    }
  }

  const handleDeleteVersion = async (versionId: number) => {
    try {
      const response = await fetch(
        `/api/admin/couplets/${coupletId}/versions/${versionId}`,
        {
          method: 'DELETE',
        }
      )
      const result = await response.json()

      if (result.success) {
        message.success('版本删除成功')
        fetchData()
      } else {
        message.error(result.error || '删除版本失败')
      }
    } catch (error) {
      message.error('删除版本失败')
    }
  }

  // Create version number mapping for parent version display
  const versionNumberMap = new Map(
    versions.map(v => [v.id, v.version])
  )

  const columns = [
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 100,
      render: (version: number, record: CoupletVersionItem) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold">v{version}</span>
          {record.isLatestVersion && (
            <Tag color="green">最新</Tag>
          )}
        </div>
      ),
    },
    {
      title: '描述',
      dataIndex: 'versionDescription',
      key: 'versionDescription',
      render: (text: string) => text || '无描述',
    },
    {
      title: '父版本',
      dataIndex: 'parentVersionId',
      key: 'parentVersionId',
      width: 160,
      render: (parentVersionId: CoupletVersionItem['parentVersionId']) =>
        parentVersionId
          ? `v${versionNumberMap.get(parentVersionId) ?? parentVersionId}`
          : '根版本',
    },
    {
      title: '内容数量',
      dataIndex: 'contentCount',
      key: 'contentCount',
      width: 120,
      render: (count: number) => (
        <Tag color="blue">{count} 项</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 300,
      render: (_: any, record: CoupletVersionItem) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() =>
              router.push(`/admin/couplets/${coupletId}/versions/${record.id}/contents`)
            }
          >
            内容
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() =>
              router.push(`/admin/couplets/${coupletId}/versions/${record.id}/edit`)
            }
          >
            编辑
          </Button>
          {!record.isLatestVersion && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              loading={settingLatestId === record.id}
              onClick={() => handleSetLatest(record.id)}
            >
              设为最新
            </Button>
          )}
          <Popconfirm
            title="确定要删除这个版本吗？"
            onConfirm={() => handleDeleteVersion(record.id)}
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
          onClick={() => router.push('/admin/couplets')}
          className="mb-4"
        >
          返回对联列表
        </Button>
        <Title level={2}>版本管理</Title>
        <p className="text-gray-600">
          查看和管理此对联的所有版本
        </p>
      </div>

      {couplet && (
        <Card title="对联信息" className="mb-6">
          <Row gutter={24}>
            <Col span={12}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="标题">
                  {couplet.title}
                </Descriptions.Item>
                <Descriptions.Item label="别名">
                  {couplet.slug}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={couplet.status === 'published' ? 'green' : 'orange'}>
                    {couplet.status === 'published' ? '已发布' : couplet.status === 'draft' ? '草稿' : '已归档'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col span={12}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="描述">
                  {couplet.description || '无描述'}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {new Date(couplet.createdAt).toLocaleString()}
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        </Card>
      )}

      <Card
        title="版本列表"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() =>
              router.push(`/admin/couplets/${coupletId}/versions/create`)
            }
          >
            创建版本
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={versions}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  )
}

export default CoupletVersionsPage