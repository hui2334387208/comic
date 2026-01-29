'use client'

import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import { Table, Button, Modal, message, Select, Space, Input, Card, Tag, Tooltip, Popconfirm, DatePicker } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useEffect, useCallback } from 'react'
import { withPagePermission } from '@/lib/withPagePermission'

interface Video {
  id: number;
  title: Record<string, string>;
  description: Record<string, string>;
  url: string;
  filename?: string;
  filesize?: string;
  filetype?: string;
  duration: number;
  views: number;
  status: 'draft' | 'published' | 'archived';
  sort: number;
  createdAt: string;
  updatedAt: string;
}

function VideoManagement() {
  const t = useTranslations('admin')
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchText && { search: searchText }),
        ...(statusFilter && { status: statusFilter }),
      })

      const response = await fetch(`/api/videos?${queryParams}`)
      const data = await response.json()

      if (data.success) {
        setVideos(data.data)
        setTotal(data.total)
      } else {
        message.error(data.message || t('videos.fetchError'))
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
      message.error(t('videos.fetchError'))
    } finally {
      setLoading(false)
    }
  }, [page, limit, searchText, statusFilter, t])

  useEffect(() => {
    fetchVideos()
  }, [page, fetchVideos])

  const handleSearch = (value: string) => {
    setSearchText(value)
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    const timeout = setTimeout(() => {
      setPage(1)
      fetchVideos()
    }, 300)
    setSearchTimeout(timeout)
  }

  const handleSearchEnter = (value: string) => {
    setSearchText(value)
    setPage(1)
    fetchVideos()
  }

  const handleStatusChange = (value: string | null) => {
    setStatusFilter(value)
    setPage(1)
    fetchVideos()
  }

  const handleReset = () => {
    setSearchText('')
    setStatusFilter(null)
    setPage(1)
    fetchVideos()
  }

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error(t('videos.deleteError'))

      message.success(t('videos.deleteSuccess'))
      fetchVideos()
    } catch (error) {
      message.error(t('videos.deleteError'))
    }
  }

  const handlePreview = (video: Video) => {
    setPreviewUrl(video.url)
    setPreviewTitle(video.title['zh'] || video.title['en'] || 'Video Preview')
    setPreviewVisible(true)
  }

  const columns: ColumnsType<Video> = [
    {
      title: t('videos.table.url'),
      dataIndex: 'url',
      key: 'url',
      width: 120,
      render: (url: string) => (
        <video
          src={url}
          width={100}
          height={100}
          style={{ objectFit: 'cover' }}
        />
      ),
    },
    {
      title: t('videos.table.title'),
      dataIndex: 'title',
      key: 'title',
      render: (title: Record<string, string>) => (
        <div className="space-y-1">
          {Object.entries(title || {}).map(([lang, value]) => (
            <div key={lang} className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">{lang.toUpperCase()}:</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: t('videos.table.filename'),
      dataIndex: 'filename',
      key: 'filename',
      width: 200,
    },
    {
      title: t('videos.table.filesize'),
      dataIndex: 'filesize',
      key: 'filesize',
      width: 120,
    },
    {
      title: t('videos.table.filetype'),
      dataIndex: 'filetype',
      key: 'filetype',
      width: 120,
    },
    {
      title: t('videos.table.duration'),
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration) => {
        const minutes = Math.floor(duration / 60)
        const seconds = duration % 60
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
      },
    },
    {
      title: t('videos.table.views'),
      dataIndex: 'views',
      key: 'views',
      width: 100,
      render: (views) => views.toLocaleString(),
    },
    {
      title: t('videos.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        let color = 'default'
        if (status === 'published') color = 'green'
        else if (status === 'draft') color = 'orange'
        else if (status === 'archived') color = 'red'
        return (
          <Tag color={color}>
            {status === 'published'
              ? t('videos.statusPublished')
              : status === 'draft'
              ? t('videos.statusDraft')
              : t('videos.statusArchived')}
          </Tag>
        )
      },
    },
    {
      title: t('videos.table.sort'),
      dataIndex: 'sort',
      key: 'sort',
      width: 100,
    },
    {
      title: t('videos.table.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: t('videos.table.actions'),
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
          >
            {t('resources.preview')}
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/videos/edit/${record.id}`)}
          >
            {t('videos.editVideo')}
          </Button>
          <Popconfirm
            title={t('videos.deleteConfirmTitle')}
            description={t('videos.deleteConfirmContent')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              {t('videos.deleteVideo')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <Card className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('videos.title')}</h1>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push('/admin/videos/create')}
            >
              {t('videos.addVideo')}
            </Button>
          </Space>
        </div>

        <div className="flex gap-4 mb-4">
          <Input.Search
            placeholder={t('videos.searchPlaceholder')}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            onSearch={handleSearchEnter}
            allowClear
            style={{ width: 200 }}
          />
          <Select
            placeholder={t('videos.statusFilter')}
            allowClear
            style={{ width: 120 }}
            value={statusFilter}
            onChange={handleStatusChange}
            options={[
              { value: 'draft', label: t('videos.statusDraft') },
              { value: 'published', label: t('videos.statusPublished') },
              { value: 'archived', label: t('videos.statusArchived') },
            ]}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={handleReset}
          >
            {t('videos.reset')}
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={videos}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            onChange: (page) => setPage(page),
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => t('videos.totalItems', { total }),
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        <video
          controls
          style={{ width: '100%' }}
          src={previewUrl}
        />
      </Modal>
    </div>
  )
}

// 使用页面级权限校验
export default withPagePermission(VideoManagement, {
  permission: 'video.read'
})
