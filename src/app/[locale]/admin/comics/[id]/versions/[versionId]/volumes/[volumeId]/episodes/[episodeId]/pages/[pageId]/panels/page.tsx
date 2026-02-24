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
  Typography,
} from 'antd'
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'

const { Paragraph, Text } = Typography

interface ComicPanel {
  id: number
  panelNumber: number
  sceneDescription: string
  dialogue: string
  narration: string
  emotion: string
  cameraAngle: string
  characters: string
  createdAt: string
}

interface Comic {
  id: number
  title: string
}

interface Page {
  id: number
  pageNumber: number
}

function ComicPanelsPage() {
  const router = useRouter()
  const params = useParams()

  const [comic, setComic] = useState<Comic | null>(null)
  const [page, setPage] = useState<Page | null>(null)
  const [panels, setPanels] = useState<ComicPanel[]>([])
  const [loading, setLoading] = useState(true)

  const comicId = params.id as string
  const versionId = params.versionId as string
  const volumeId = params.volumeId as string
  const episodeId = params.episodeId as string
  const pageId = params.pageId as string

  useEffect(() => {
    if (comicId && versionId && volumeId && episodeId && pageId) {
      fetchComic()
      fetchPage()
      fetchPanels()
    }
  }, [comicId, versionId, volumeId, episodeId, pageId])

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

  const fetchPage = async () => {
    try {
      const response = await fetch(`/api/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes/${episodeId}/pages/${pageId}`)
      const result = await response.json()
      if (result.success) {
        setPage(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch page:', error)
    }
  }

  const fetchPanels = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes/${episodeId}/pages/${pageId}/panels`)
      const result = await response.json()

      if (result.success) {
        setPanels(result.data.items || [])
      } else {
        message.error(result.error || '获取分镜列表失败')
      }
    } catch (error) {
      message.error('获取分镜列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePanel = () => {
    router.push(`/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes/${episodeId}/pages/${pageId}/panels/create`)
  }

  const handleDelete = async (panelId: number) => {
    try {
      const response = await fetch(`/api/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes/${episodeId}/pages/${pageId}/panels/${panelId}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        message.success('分镜删除成功')
        fetchPanels()
      } else {
        message.error(result.error || '删除分镜失败')
      }
    } catch (error) {
      message.error('删除分镜失败')
    }
  }

  const columns = [
    {
      title: '格数',
      dataIndex: 'panelNumber',
      key: 'panelNumber',
      width: 80,
      render: (num: number) => <div className="font-medium">第 {num} 格</div>,
    },
    {
      title: '画面描述',
      dataIndex: 'sceneDescription',
      key: 'sceneDescription',
      render: (text: string) => (
        <Paragraph ellipsis={{ rows: 2, expandable: true }} className="mb-0">
          {text || <Text type="secondary">无描述</Text>}
        </Paragraph>
      ),
    },
    {
      title: '对话',
      dataIndex: 'dialogue',
      key: 'dialogue',
      render: (text: string) => (
        <Paragraph ellipsis={{ rows: 2, expandable: true }} className="mb-0">
          {text || <Text type="secondary">无对话</Text>}
        </Paragraph>
      ),
    },
    {
      title: '旁白',
      dataIndex: 'narration',
      key: 'narration',
      render: (text: string) => (
        text ? <Tag color="purple">{text}</Tag> : <Text type="secondary">无</Text>
      ),
    },
    {
      title: '情感/镜头',
      key: 'details',
      render: (_: any, record: ComicPanel) => (
        <div className="text-sm">
          {record.emotion && <div><Tag color="orange">{record.emotion}</Tag></div>}
          {record.cameraAngle && <div className="mt-1"><Tag color="blue">{record.cameraAngle}</Tag></div>}
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'characters',
      key: 'characters',
      render: (characters: string) => {
        if (!characters) return <Text type="secondary">无</Text>
        try {
          const charList = JSON.parse(characters)
          return (
            <div>
              {Array.isArray(charList) ? charList.map((char: any, idx: number) => (
                <Tag key={idx} color="green">{char.name || char}</Tag>
              )) : <Tag color="green">{characters}</Tag>}
            </div>
          )
        } catch {
          return <Tag color="green">{characters}</Tag>
        }
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: ComicPanel) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes/${episodeId}/pages/${pageId}/panels/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个分镜吗？"
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
          onClick={() => router.push(`/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes/${episodeId}/pages`)}
          className="mb-4"
        >
          返回页列表
        </Button>
        
        <h1 className="text-2xl font-bold mb-4">分镜管理</h1>

        {comic && page && (
          <Card className="mb-6">
            <Descriptions column={2}>
              <Descriptions.Item label="漫画标题">{comic.title}</Descriptions.Item>
              <Descriptions.Item label="页码">第 {page.pageNumber} 页</Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        <div className="flex justify-between items-center mb-4">
          <div className="text-gray-600">
            共 {panels.length} 个分镜
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreatePanel}>
            创建新分镜
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={panels}
        rowKey="id"
        loading={loading}
        pagination={false}
      />
    </div>
  )
}

export default ComicPanelsPage
