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
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface CoupletTag {
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

function CoupletTagListPage() {
  const t = useTranslations('admin.coupletTags')
  const router = useRouter()

  const [tags, setTags] = useState<CoupletTag[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  })

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingTag, setEditingTag] = useState<CoupletTag | null>(null)
  const [form] = Form.useForm()

  const fetchTags = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(searchText && { search: searchText }),
        ...(statusFilter && { status: statusFilter }),
      })

      const response = await fetch(`/api/admin/couplet-tags?${params}`)
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

  const handleCreate = () => {
    setEditingTag(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEdit = (tag: CoupletTag) => {
    setEditingTag(tag)
    form.setFieldsValue(tag)
    setIsModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/couplet-tags/${id}`, {
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

  const handleSubmit = async (values: any) => {
    try {
      const url = editingTag
        ? `/api/admin/couplet-tags/${editingTag.id}`
        : '/api/admin/couplet-tags'
      const method = editingTag ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      const result = await response.json()

      if (result.success) {
        message.success(
          editingTag ? '标签更新成功' : '标签创建成功',
        )
        setIsModalVisible(false)
        fetchTags()
      } else {
        message.error(result.error || '保存标签失败')
      }
    } catch (error) {
      message.error('保存标签失败')
    }
  }

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: CoupletTag) => (
        <Tag color={record.color}>{text}</Tag>
      ),
    },
    {
      title: '别名',
      dataIndex: 'slug',
      key: 'slug',
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
      render: (_: any, record: CoupletTag) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/couplets/tags/edit/${record.id}`)}
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
        <h1 className="text-2xl font-bold mb-4">对联标签管理</h1>
        
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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/admin/couplets/tags/create')}>
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

      <Modal
        title={editingTag ? '编辑标签' : '创建标签'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入标签名称' }]}
          >
            <Input placeholder="输入标签名称" />
          </Form.Item>

          <Form.Item name="slug" label="别名">
            <Input placeholder="留空则自动生成" />
          </Form.Item>

          <Form.Item name="color" label="颜色" initialValue="#1890ff">
            <Input type="color" />
          </Form.Item>

          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">禁用</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingTag ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CoupletTagListPage