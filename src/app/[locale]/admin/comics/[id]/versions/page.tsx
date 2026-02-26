'use client'

import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  message,
  Popconfirm,
  Tag,
  Card,
  Descriptions,
  Spin,
} from 'antd'
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
import { withPagePermission } from '@/lib/withPagePermission'

interface ComicVersion {
  id: number
  version: number
  versionDescription: string
  isLatestVersion: boolean
  createdAt: string
  updatedAt: string
}

interface Comic {
  id: number
  title: string
  slug: string
}

function ComicVersionsPage() {
  const router = useRouter()
  const params = useParams()

  const [comic, setComic] = useState<Comic | null>(null)
  const [versions, setVersions] = useState<ComicVersion[]>([])
  const [loading, setLoading] = useState(true)

  const comicId = params.id as string

  useEffect(() => {
    if (comicId) {
      fetchComic()
      fetchVersions()
    }
  }, [comicId])

  const fetchComic = async () => {
    try {
      const response = await fetch(`/api/admin/comics/${comicId}`)
      const result = await response.json()
      if (result.success) {
        setComic(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch comic:', error)
    }
  }

  const fetchVersions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/comics/${comicId}/versions`)
      const result = await response.json()

      if (result.success) {
        setVersions(result.data.items || [])
      } else {
        message.error(result.error || '获取版本列表失败')
      }
    } catch (error) {
      message.error('获取版本列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVersion = () => {
    router.push(`/admin/comics/${comicId}/versions/create`)
  }

  const handleViewVolumes = (versionId: number) => {
    router.push(`/admin/comics/${comicId}/versions/${versionId}/volumes`)
  }

  const handleDelete = async (versionId: number) => {
    try {
      const response = await fetch(`/api/admin/comics/${comicId}/versions/${versionId}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        message.success('版本删除成功')
        fetchVersions()
      } else {
        message.error(result.error || '删除版本失败')
      }
    } catch (error) {
      message.error('删除版本失败')
    }
  }

  const columns = [
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      render: (version: number, record: ComicVersion) => (
        <div>
          <div className="font-medium">版本 {version}</div>
          {record.isLatestVersion && <Tag color="green">最新版本</Tag>}
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
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: ComicVersion) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewVolumes(record.id)}
          >
            查看卷
          </Button>
          <Popconfirm
            title="确定要删除这个版本吗？"
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

  if (loading && !comic) {
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
          onClick={() => router.push('/admin/comics')}
          className="mb-4"
        >
          返回漫画列表
        </Button>
        
        <h1 className="text-2xl font-bold mb-4">漫画版本管理</h1>

        {comic && (
          <Card className="mb-6">
            <Descriptions column={2}>
              <Descriptions.Item label="漫画标题">{comic.title}</Descriptions.Item>
              <Descriptions.Item label="别名">{comic.slug}</Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        <div className="flex justify-between items-center mb-4">
          <div className="text-gray-600">
            共 {versions.length} 个版本
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateVersion}>
            创建新版本
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={versions}
        rowKey="id"
        loading={loading}
        pagination={false}
      />
    </div>
  )
}

export default withPagePermission(ComicVersionsPage, {
  permission: 'comic-version.read'
})
