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
  InputNumber,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface CoupletCategory {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  color: string
  status: 'active' | 'inactive'
  sortOrder: number
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

function CoupletCategoryListPage() {
  const t = useTranslations('admin.coupletCategories')
  const router = useRouter()

  const [categories, setCategories] = useState<CoupletCategory[]>([])
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
  const [editingCategory, setEditingCategory] = useState<CoupletCategory | null>(null)
  const [form] = Form.useForm()

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(searchText && { search: searchText }),
        ...(statusFilter && { status: statusFilter }),
      })

      const response = await fetch(`/api/admin/couplet-categories?${params}`)
      const result = await response.json()

      if (result.success) {
        setCategories(result.data.items)
        setPagination(result.data.pagination)
      } else {
        message.error(result.error || '获取分类列表失败')
      }
    } catch (error) {
      message.error('获取分类列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
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
    setEditingCategory(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEdit = (category: CoupletCategory) => {
    setEditingCategory(category)
    form.setFieldsValue(category)
    setIsModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/couplet-categories/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        message.success('分类删除成功')
        fetchCategories()
      } else {
        message.error(result.error || '删除分类失败')
      }
    } catch (error) {
      message.error('删除分类失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const url = editingCategory
        ? `/api/admin/couplet-categories/${editingCategory.id}`
        : '/api/admin/couplet-categories'
      const method = editingCategory ? 'PUT' : 'POST'

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
          editingCategory ? '分类更新成功' : '分类创建成功',
        )
        setIsModalVisible(false)
        fetchCategories()
      } else {
        message.error(result.error || '保存分类失败')
      }
    } catch (error) {
      message.error('保存分类失败')
    }
  }

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: CoupletCategory) => (
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '18px' }}>{record.icon}</span>
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-sm text-gray-500">{record.slug}</div>
          </div>
        </div>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <div className="max-w-xs truncate" title={text}>
          {text || '无描述'}
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
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
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
      render: (_: any, record: CoupletCategory) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/couplets/categories/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个分类吗？"
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
        <h1 className="text-2xl font-bold mb-4">对联分类管理</h1>
        
        <Row gutter={16} className="mb-6">
          <Col span={8}>
            <Card>
              <Statistic title="总分类数" value={pagination.total} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic 
                title="启用分类" 
                value={categories.filter(cat => cat.status === 'active').length} 
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic 
                title="禁用分类" 
                value={categories.filter(cat => cat.status === 'inactive').length} 
              />
            </Card>
          </Col>
        </Row>

        <div className="flex justify-between items-center mb-4">
          <Space>
            <Input.Search
              placeholder="搜索分类..."
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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/admin/couplets/categories/create')}>
            创建分类
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={categories}
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
        title={editingCategory ? '编辑分类' : '创建分类'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="输入分类名称" />
          </Form.Item>

          <Form.Item name="slug" label="别名">
            <Input placeholder="留空则自动生成" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="输入分类描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="icon" label="图标" initialValue="📝">
                <Input placeholder="输入表情图标" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="color" label="颜色" initialValue="#1890ff">
                <Input type="color" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="状态" initialValue="active">
                <Select>
                  <Select.Option value="active">启用</Select.Option>
                  <Select.Option value="inactive">禁用</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sortOrder" label="排序" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingCategory ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CoupletCategoryListPage