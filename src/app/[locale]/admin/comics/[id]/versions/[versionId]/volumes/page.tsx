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
  Image,
} from 'antd'
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
import { withPagePermission } from '@/lib/withPagePermission'

interface ComicVolume {
  id: number
  volumeNumber: number
  title: string
  description: string
  coverImage: string
  episodeCount: number
  startEpisode: number
  endEpisode: number
  status: string
  createdAt: string
}

interface Comic {
  id: number
  title: string
}

interface Version {
  id: number
  version: number
}

function ComicVolumesPage() {
  const router = useRouter()
  const params = useParams()

  const [comic, setComic] = useState<Comic | null>(null)
  const [version, setVersion] = useState<Version | null>(null)
  const [volumes, setVolumes] = useState<ComicVolume[]>([])
  const [loading, setLoading] = useState(true)

  const comicId = params.id as string
  const versionId = params.versionId as string

  useEffect(() => {
    if (comicId && versionId) {
      fetchComic()
      fetchVersion()
      fetchVolumes()
    }
  }, [comicId, versionId])

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

  const fetchVersion = async () => {
    try {
      const response = await fetch(`/api/admin/comics/${comicId}/versions/${versionId}`)
      const result = await response.json()
      if (result.success) {
        setVersion(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch version:', error)
    }
  }

  const fetchVolumes = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/comics/${comicId}/versions/${versionId}/volumes`)
      const result = await response.json()

      if (result.success) {
        setVolumes(result.data.items || [])
      } else {
        message.error(result.error || '获取卷列表失败')
      }
    } catch (error) {
      message.error('获取卷列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVolume = () => {
    router.push(`/admin/comics/${comicId}/versions/${versionId}/volumes/create`)
  }

  const handleViewEpisodes = (volumeId: number) => {
    router.push(`/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes`)
  }

  const handleDelete = async (volumeId: number) => {
    try {
      const response = await fetch(`/api/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        message.success('卷删除成功')
        fetchVolumes()
      } else {
        message.error(result.error || '删除卷失败')
      }
    } catch (error) {
      message.error('删除卷失败')
    }
  }

  const columns = [
    {
      title: '封面',
      dataIndex: 'coverImage',
      key: 'coverImage',
      width: 80,
      render: (coverImage: string) => (
        coverImage ? (
          <Image
            src={coverImage}
            alt="封面"
            width={60}
            height={80}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className="w-15 h-20 bg-gray-200 flex items-center justify-center text-gray-400">
            无封面
          </div>
        )
      ),
    },
    {
      title: '卷信息',
      key: 'volumeInfo',
      render: (_: any, record: ComicVolume) => (
        <div>
          <div className="font-medium">第 {record.volumeNumber} 卷</div>
          <div className="text-sm text-gray-600">{record.title}</div>
          <div className="text-xs text-gray-400 mt-1">{record.description}</div>
        </div>
      ),
    },
    {
      title: '话数范围',
      key: 'episodeRange',
      render: (_: any, record: ComicVolume) => (
        <div className="text-sm">
          {record.startEpisode && record.endEpisode ? (
            <span>第 {record.startEpisode} - {record.endEpisode} 话</span>
          ) : (
            <span className="text-gray-400">未设置</span>
          )}
        </div>
      ),
    },
    {
      title: '话数',
      dataIndex: 'episodeCount',
      key: 'episodeCount',
      render: (count: number) => <Tag color="blue">{count} 话</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          published: 'green',
          draft: 'orange',
          archived: 'red',
        }
        const statusText = {
          published: '已发布',
          draft: '草稿',
          archived: '已归档',
        }
        return <Tag color={colors[status as keyof typeof colors]}>{statusText[status as keyof typeof statusText] || status}</Tag>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: ComicVolume) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewEpisodes(record.id)}
          >
            查看话
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/comics/${comicId}/versions/${versionId}/volumes/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这卷吗？"
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
          onClick={() => router.push(`/admin/comics/${comicId}/versions`)}
          className="mb-4"
        >
          返回版本列表
        </Button>
        
        <h1 className="text-2xl font-bold mb-4">卷管理</h1>

        {comic && version && (
          <Card className="mb-6">
            <Descriptions column={2}>
              <Descriptions.Item label="漫画标题">{comic.title}</Descriptions.Item>
              <Descriptions.Item label="版本">版本 {version.version}</Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        <div className="flex justify-between items-center mb-4">
          <div className="text-gray-600">
            共 {volumes.length} 卷
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateVolume}>
            创建新卷
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={volumes}
        rowKey="id"
        loading={loading}
        pagination={false}
      />
    </div>
  )
}

export default withPagePermission(ComicVolumesPage, {
  permission: 'comic-volume.read'
})
