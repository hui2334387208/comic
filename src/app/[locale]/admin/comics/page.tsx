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
  Row,
  Col,
  Statistic,
  Switch,
  Input,
  Select,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'

interface Comic {
  id: number
  title: string
  slug: string
  description: string
  status: 'published' | 'draft' | 'archived'
  isPublic: boolean
  viewCount: number
  likeCount: number
  volumeCount: number
  episodeCount: number
  createdAt: string
  author?: {
    name: string
    email: string
  }
  category?: {
    name: string
  }
}

interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

function ComicListPage() {
  const router = useRouter()

  const [comics, setComics] = useState<Comic[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  })

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchComics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(searchText && { search: searchText }),
        ...(statusFilter && { status: statusFilter }),
      })

      const response = await fetch(`/api/admin/comics?${params}`)
      const result = await response.json()

      if (result.success) {
        setComics(result.data.items || [])
        setPagination(result.data.pagination)
      } else {
        message.error(result.error || '获取漫画列表失败')
      }
    } catch (error) {
      message.error('获取漫画列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComics()
  }, [pagination.page, pagination.pageSize, searchText, statusFilter])

  const handleSearch = (value: string) => {
    setSearchText(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleCreate = () => {
    router.push('/admin/comics/create')
  }

  const handleEdit = (id: number) => {
    router.push(`/admin/comics/edit/${id}`)
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/comics/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        message.success('漫画删除成功')
        fetchComics()
      } else {
        message.error(result.error || '删除漫画失败')
      }
    } catch (error) {
      message.error('删除漫画失败')
    }
  }

  const handleTogglePublic = async (id: number, isPublic: boolean) => {
    try {
      const response = await fetch(`/api/admin/comics/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublic }),
      })
      const result = await response.json()

      if (result.success) {
        message.success(`漫画${isPublic ? '发布' : '取消发布'}成功`)
        fetchComics()
      } else {
        message.error(result.error || '更新漫画失败')
      }
    } catch (error) {
      message.error('更新漫画失败')
    }
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Comic) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-sm text-gray-500">{record.slug}</div>
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: any) => category?.name || '未分类',
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      render: (author: any) => author?.name || '未知',
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
        return <Tag color={colors[status as keyof typeof colors]}>{statusText[status as keyof typeof statusText]}</Tag>
      },
    },
    {
      title: '公开',
      dataIndex: 'isPublic',
      key: 'isPublic',
      render: (isPublic: boolean, record: Comic) => (
        <Switch
          checked={isPublic}
          onChange={(checked) => handleTogglePublic(record.id, checked)}
          size="small"
        />
      ),
    },
    {
      title: '内容',
      key: 'content',
      render: (_: any, record: Comic) => (
        <div className="text-sm">
          <div>卷: {record.volumeCount || 0}</div>
          <div>话: {record.episodeCount || 0}</div>
        </div>
      ),
    },
    {
      title: '统计',
      key: 'stats',
      render: (_: any, record: Comic) => (
        <div className="text-sm">
          <div>浏览: {record.viewCount}</div>
          <div>点赞: {record.likeCount}</div>
        </div>
      ),
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
      render: (_: any, record: Comic) => (
        <Space>
          <Button
            type="link"
            onClick={() => router.push(`/admin/comics/${record.id}/versions`)}
          >
            版本
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个漫画吗？"
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
        <h1 className="text-2xl font-bold mb-4">漫画管理</h1>
        
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic title="总漫画数" value={pagination.total} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="已发布" 
                value={comics.filter(c => c.status === 'published').length} 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="草稿" 
                value={comics.filter(c => c.status === 'draft').length} 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="总浏览量" 
                value={comics.reduce((sum, c) => sum + c.viewCount, 0)} 
              />
            </Card>
          </Col>
        </Row>

        <div className="flex justify-between items-center mb-4">
          <Space>
            <Input.Search
              placeholder="搜索漫画..."
              allowClear
              onSearch={handleSearch}
              style={{ width: 300 }}
            />
            <Select
              placeholder="按状态筛选"
              allowClear
              style={{ width: 150 }}
              onChange={handleStatusFilter}
            >
              <Select.Option value="published">已发布</Select.Option>
              <Select.Option value="draft">草稿</Select.Option>
              <Select.Option value="archived">已归档</Select.Option>
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建漫画
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={comics}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} 共 ${total} 条`,
          onChange: (page, pageSize) => {
            setPagination(prev => ({ ...prev, page, pageSize }))
          },
        }}
      />
    </div>
  )
}

export default ComicListPage
