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
  Input,
  Select,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { withPagePermission } from '@/lib/withPagePermission'

interface ComicTag {
  id: number
  name: string
  slug: string
  color: string
  status: 'active' | 'inactive'
  createdAt: string
}

interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

function ComicTagListPage() {
  const router = useRouter()

  const [tags, setTags] = useState<ComicTag[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  })

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchTags = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(searchText && { search: searchText }),
        ...(statusFilter && { status: statusFilter }),
      })

      const response = await fetch(`/api/admin/comics/tags?${params}`)
      const result = await response.json()

      if (result.success) {
        setTags(result.data.items)
        setPagination(result.data.pagination)
      } else {
        message.error(result.error || '获取标签列表失败')
      }
    } catch (error) {
      message.error('获取标签列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTags()
  }, [pagination.page, pagination.pageSize, searchText, statusFilter])

  const handleSearch = (value: string) => {
    setSearchText(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/comics/tags/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        message.success('标签删除成功')
        fetchTags()
      } else {
        message.error(result.error || '删除标签失败')
      }
    } catch (error) {
      message.error('删除标签失败')
    }
  }

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ComicTag) => (
        <div>
          <Tag color={record.color}>{text}</Tag>
          <div className="text-sm text-gray-500 mt-1">{record.slug}</div>
        </div>
      ),
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      render: (color: string) => (
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 24,
              height: 24,
              backgroundColor: color,
              borderRadius: 4,
              border: '1px solid #d9d9d9',
            }}
          />
          <span className="text-sm text-gray-600">{color}</span>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
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
      render: (_: any, record: ComicTag) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/comics/tags/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个标签吗？"
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
        <h1 className="text-2xl font-bold mb-4">漫画标签管理</h1>
        
        <Row gutter={16} className="mb-6">
          <Col span={8}>
            <Card>
              <Statistic title="总标签数" value={pagination.total} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic 
                title="启用标签" 
                value={tags.filter(tag => tag.status === 'active').length} 
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic 
                title="禁用标签" 
                value={tags.filter(tag => tag.status === 'inactive').length} 
              />
            </Card>
          </Col>
        </Row>

        <div className="flex justify-between items-center mb-4">
          <Space>
            <Input.Search
              placeholder="搜索标签..."
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
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">禁用</Select.Option>
            </Select>
          </Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => router.push('/admin/comics/tags/create')}
          >
            创建标签
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={tags}
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

export default withPagePermission(ComicTagListPage, { permission: 'comic-tag.read' })
