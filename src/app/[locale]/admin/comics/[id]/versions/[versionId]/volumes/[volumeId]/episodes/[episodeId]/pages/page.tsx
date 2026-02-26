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

interface ComicPage {
  id: number
  pageNumber: number
  pageLayout: string
  panelCount: number
  imageUrl: string
  status: string
  createdAt: string
}

interface Comic {
  id: number
  title: string
}

interface Episode {
  id: number
  episodeNumber: number
  title: string
}

function ComicPagesPage() {
  const router = useRouter()
  const params = useParams()

  const [comic, setComic] = useState<Comic | null>(null)
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [pages, setPages] = useState<ComicPage[]>([])
  const [loading, setLoading] = useState(true)

  const comicId = params.id as string
  const versionId = params.versionId as string
  const volumeId = params.volumeId as string
  const episodeId = params.episodeId as string

  useEffect(() => {
    if (comicId && versionId && volumeId && episodeId) {
      fetchComic()
      fetchEpisode()
      fetchPages()
    }
  }, [comicId, versionId, volumeId, episodeId])

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

  const fetchEpisode = async () => {
    try {
      const response = await fetch(`/api/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes/${episodeId}`)
      const result = await response.json()
      if (result.success) {
        setEpisode(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch episode:', error)
    }
  }

  const fetchPages = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes/${episodeId}/pages`)
      const result = await response.json()

      if (result.success) {
        setPages(result.data.items || [])
      } else {
        message.error(result.error || '获取页列表失败')
      }
    } catch (error) {
      message.error('获取页列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePage = () => {
    router.push(`/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes/${episodeId}/pages/create`)
  }

  const handleViewPanels = (pageId: number) => {
    router.push(`/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes/${episodeId}/pages/${pageId}/panels`)
  }

  const handleDelete = async (pageId: number) => {
    try {
      const response = await fetch(`/api/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes/${episodeId}/pages/${pageId}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        message.success('页删除成功')
        fetchPages()
      } else {
        message.error(result.error || '删除页失败')
      }
    } catch (error) {
      message.error('删除页失败')
    }
  }

  const columns = [
    {
      title: '页面图片',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 120,
      render: (imageUrl: string) => (
        imageUrl ? (
          <Image
            src={imageUrl}
            alt="页面"
            width={100}
            height={140}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className="w-25 h-35 bg-gray-200 flex items-center justify-center text-gray-400">
            无图片
          </div>
        )
      ),
    },
    {
      title: '页码',
      dataIndex: 'pageNumber',
      key: 'pageNumber',
      render: (num: number) => <div className="font-medium">第 {num} 页</div>,
    },
    {
      title: '布局',
      dataIndex: 'pageLayout',
      key: 'pageLayout',
      render: (layout: string) => <Tag color="cyan">{layout || '默认'}</Tag>,
    },
    {
      title: '分镜数',
      dataIndex: 'panelCount',
      key: 'panelCount',
      render: (count: number) => <Tag color="blue">{count} 格</Tag>,
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
      render: (_: any, record: ComicPage) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewPanels(record.id)}
          >
            查看分镜
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes/${episodeId}/pages/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这页吗？"
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
          onClick={() => router.push(`/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes`)}
          className="mb-4"
        >
          返回话列表
        </Button>
        
        <h1 className="text-2xl font-bold mb-4">页管理</h1>

        {comic && episode && (
          <Card className="mb-6">
            <Descriptions column={3}>
              <Descriptions.Item label="漫画标题">{comic.title}</Descriptions.Item>
              <Descriptions.Item label="话">第 {episode.episodeNumber} 话</Descriptions.Item>
              <Descriptions.Item label="话标题">{episode.title}</Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        <div className="flex justify-between items-center mb-4">
          <div className="text-gray-600">
            共 {pages.length} 页
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreatePage}>
            创建新页
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={pages}
        rowKey="id"
        loading={loading}
        pagination={false}
      />
    </div>
  )
}

export default withPagePermission(ComicPagesPage, {
  permission: 'comic-page.read'
})
