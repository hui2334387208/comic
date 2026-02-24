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

interface ComicEpisode {
  id: number
  episodeNumber: number
  title: string
  description: string
  pageCount: number
  status: string
  createdAt: string
}

interface Comic {
  id: number
  title: string
}

interface Volume {
  id: number
  volumeNumber: number
  title: string
}

function ComicEpisodesPage() {
  const router = useRouter()
  const params = useParams()

  const [comic, setComic] = useState<Comic | null>(null)
  const [volume, setVolume] = useState<Volume | null>(null)
  const [episodes, setEpisodes] = useState<ComicEpisode[]>([])
  const [loading, setLoading] = useState(true)

  const comicId = params.id as string
  const versionId = params.versionId as string
  const volumeId = params.volumeId as string

  useEffect(() => {
    if (comicId && versionId && volumeId) {
      fetchComic()
      fetchVolume()
      fetchEpisodes()
    }
  }, [comicId, versionId, volumeId])

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

  const fetchVolume = async () => {
    try {
      const response = await fetch(`/api/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}`)
      const result = await response.json()
      if (result.success) {
        setVolume(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch volume:', error)
    }
  }

  const fetchEpisodes = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes`)
      const result = await response.json()

      if (result.success) {
        setEpisodes(result.data.items || [])
      } else {
        message.error(result.error || '获取话列表失败')
      }
    } catch (error) {
      message.error('获取话列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEpisode = () => {
    router.push(`/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes/create`)
  }

  const handleViewPages = (episodeId: number) => {
    router.push(`/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes/${episodeId}/pages`)
  }

  const handleDelete = async (episodeId: number) => {
    try {
      const response = await fetch(`/api/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes/${episodeId}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        message.success('话删除成功')
        fetchEpisodes()
      } else {
        message.error(result.error || '删除话失败')
      }
    } catch (error) {
      message.error('删除话失败')
    }
  }

  const columns = [
    {
      title: '话数',
      dataIndex: 'episodeNumber',
      key: 'episodeNumber',
      render: (num: number) => <div className="font-medium">第 {num} 话</div>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: ComicEpisode) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-400 mt-1">{record.description}</div>
        </div>
      ),
    },
    {
      title: '页数',
      dataIndex: 'pageCount',
      key: 'pageCount',
      render: (count: number) => <Tag color="blue">{count} 页</Tag>,
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
      render: (_: any, record: ComicEpisode) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewPages(record.id)}
          >
            查看页
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这话吗？"
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
          onClick={() => router.push(`/admin/comics/${comicId}/versions/${versionId}/volumes`)}
          className="mb-4"
        >
          返回卷列表
        </Button>
        
        <h1 className="text-2xl font-bold mb-4">话管理</h1>

        {comic && volume && (
          <Card className="mb-6">
            <Descriptions column={3}>
              <Descriptions.Item label="漫画标题">{comic.title}</Descriptions.Item>
              <Descriptions.Item label="卷">第 {volume.volumeNumber} 卷</Descriptions.Item>
              <Descriptions.Item label="卷标题">{volume.title}</Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        <div className="flex justify-between items-center mb-4">
          <div className="text-gray-600">
            共 {episodes.length} 话
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateEpisode}>
            创建新话
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={episodes}
        rowKey="id"
        loading={loading}
        pagination={false}
      />
    </div>
  )
}

export default ComicEpisodesPage
