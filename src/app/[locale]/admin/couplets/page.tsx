'use client'

import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Switch,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface Couplet {
  id: number
  title: string
  slug: string
  description: string
  status: 'published' | 'draft' | 'archived'
  isPublic: boolean
  viewCount: number
  likeCount: number
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

function CoupletListPage() {
  const t = useTranslations('admin.couplets')
  const router = useRouter()

  const [couplets, setCouplets] = useState<Couplet[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  })

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchCouplets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(searchText && { search: searchText }),
        ...(statusFilter && { status: statusFilter }),
      })

      const response = await fetch(`/api/admin/couplets?${params}`)
      const result = await response.json()

      if (result.success) {
        setCouplets(result.data.items || [])
        setPagination(result.data.pagination)
      } else {
        message.error(result.error || '获取对联列表失败')
      }
    } catch (error) {
      message.error('获取对联列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCouplets()
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
    router.push('/admin/couplets/create')
  }

  const handleEdit = (id: number) => {
    router.push(`/admin/couplets/edit/${id}`)
  }

  const handleView = (id: number) => {
    router.push(`/admin/couplets/${id}`)
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/couplets/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        message.success('对联删除成功')
        fetchCouplets()
      } else {
        message.error(result.error || '删除对联失败')
      }
    } catch (error) {
      message.error('删除对联失败')
    }
  }

  const handleTogglePublic = async (id: number, isPublic: boolean) => {
    try {
      const response = await fetch(`/api/admin/couplets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublic }),
      })
      const result = await response.json()

      if (result.success) {
        message.success(`对联${isPublic ? '发布' : '取消发布'}成功`)
        fetchCouplets()
      } else {
        message.error(result.error || '更新对联失败')
      }
    } catch (error) {
      message.error('更新对联失败')
    }
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Couplet) => (
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
      render: (isPublic: boolean, record: Couplet) => (
        <Switch
          checked={isPublic}
          onChange={(checked) => handleTogglePublic(record.id, checked)}
          size="small"
        />
      ),
    },
    {
      title: '统计',
      key: 'stats',
      render: (_: any, record: Couplet) => (
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
      render: (_: any, record: Couplet) => (
        <Space>
          <Button
            type="link"
            onClick={() => router.push(`/admin/couplets/${record.id}/versions`)}
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
            title="确定要删除这个对联吗？"
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
        <h1 className="text-2xl font-bold mb-4">对联管理</h1>
        
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic title="总对联数" value={pagination.total} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="已发布" 
                value={couplets.filter(c => c.status === 'published').length} 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="草稿" 
                value={couplets.filter(c => c.status === 'draft').length} 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="总浏览量" 
                value={couplets.reduce((sum, c) => sum + c.viewCount, 0)} 
              />
            </Card>
          </Col>
        </Row>

        <div className="flex justify-between items-center mb-4">
          <Space>
            <Input.Search
              placeholder="搜索对联..."
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
            创建对联
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={couplets}
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

export default CoupletListPage