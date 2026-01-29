'use client'

import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  Table, message, Spin, Button, Space, Popconfirm, Card, Row, Col, Typography, Alert, Switch,
} from 'antd'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useCallback } from 'react'
import { withPagePermission } from '@/lib/withPagePermission'

const { Title } = Typography

interface MenuDataType {
  id: number;
  path: string;
  icon?: string;
  parentId?: number | null;
  order: number;
  status: string;
  isTop: boolean;
  createdAt: string;
  updatedAt: string;
  children?: MenuDataType[];
  translations: {
    lang: string;
    name: string;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
  }[];
}

const MainMenusPage = () => {
  const router = useRouter()
  const [menus, setMenus] = useState<MenuDataType[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<{ id: number, field: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 获取菜单树
  const fetchMenus = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/main-menus')
      if (!response.ok) throw new Error('获取菜单失败')
      const data = await response.json()
      setMenus(data)
    } catch (err: any) {
      setError(err.message)
      message.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMenus()
  }, [fetchMenus])

  // 状态切换
  const handleStatusChange = async (menuId: number, newStatus: string) => {
    setUpdatingStatus({ id: menuId, field: 'status' })
    try {
      const response = await fetch(`/api/admin/main-menus/${menuId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error('状态更新失败')
      message.success('状态已更新')
      // 只更新本地数据
      setMenus(prev =>
        prev.map(menu =>
          menu.id === menuId ? { ...menu, status: newStatus } : menu,
        ),
      )
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setUpdatingStatus(null)
    }
  }

  // 顶部菜单切换
  const handleTopChange = async (menuId: number, newIsTop: boolean) => {
    setUpdatingStatus({ id: menuId, field: 'isTop' })
    try {
      const response = await fetch(`/api/admin/main-menus/${menuId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTop: newIsTop }),
      })
      if (!response.ok) throw new Error('顶部菜单更新失败')
      message.success('顶部菜单状态已更新')
      setMenus(prev =>
        prev.map(menu =>
          menu.id === menuId ? { ...menu, isTop: newIsTop } : menu,
        ),
      )
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setUpdatingStatus(null)
    }
  }

  // 删除菜单
  const handleDelete = async (menuId: number) => {
    try {
      const response = await fetch(`/api/admin/main-menus/${menuId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('删除失败')
      message.success('删除成功')
      fetchMenus()
    } catch (err: any) {
      message.error(err.message)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '名称',
      dataIndex: 'translations',
      key: 'name',
      render: (translations: any[] = []) => (
        <div>
          {translations.map(trans => (
            <div key={trans.lang}>{trans.lang}: {trans.name}</div>
          ))}
        </div>
      ),
    },
    { title: '路径', dataIndex: 'path', key: 'path' },
    { title: '图标', dataIndex: 'icon', key: 'icon', render: (icon: string) => icon ? <span>{icon}</span> : '-' },
    { title: '排序', dataIndex: 'order', key: 'order' },
    {
      title: '启用状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string, record: MenuDataType) => (
        <Switch
          checked={status === 'active'}
          onChange={checked => handleStatusChange(record.id, checked ? 'active' : 'inactive')}
          loading={updatingStatus?.id === record.id && updatingStatus?.field === 'status'}
        />
      ),
    },
    {
      title: '顶部菜单',
      dataIndex: 'isTop',
      key: 'isTop',
      width: 100,
      render: (isTop: boolean, record: MenuDataType) => (
        <Switch
          checked={isTop}
          onChange={checked => handleTopChange(record.id, checked)}
          loading={updatingStatus?.id === record.id && updatingStatus?.field === 'isTop'}
        />
      ),
    },
    {
      title: 'SEO标题',
      dataIndex: 'translations',
      key: 'metaTitle',
      render: (translations: any[] = []) => (
        <div>
          {translations.map(trans => (
            <div key={trans.lang}>{trans.lang}: {trans.metaTitle || '-'}</div>
          ))}
        </div>
      ),
    },
    {
      title: 'SEO描述',
      dataIndex: 'translations',
      key: 'metaDescription',
      render: (translations: any[] = []) => (
        <div>
          {translations.map(trans => (
            <div key={trans.lang}>{trans.lang}: {trans.metaDescription || '-'}</div>
          ))}
        </div>
      ),
    },
    {
      title: 'SEO关键词',
      dataIndex: 'translations',
      key: 'metaKeywords',
      render: (translations: any[] = []) => (
        <div>
          {translations.map(trans => (
            <div key={trans.lang}>{trans.lang}: {trans.metaKeywords || '-'}</div>
          ))}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: MenuDataType) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/main-menus/${record.id}/edit`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该菜单吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            icon={<DeleteOutlined style={{ color: 'red' }} />}
          >
            <Button icon={<DeleteOutlined />} danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '24px 32px',
        borderRadius: 12,
        marginBottom: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}>
        <Title level={2} style={{ color: 'white', margin: 0 }}>主菜单管理</Title>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>管理系统主菜单，支持多级菜单、状态切换与多语言翻译。</p>
      </div>
      <Card
        bordered={false}
        style={{
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }} align="middle">
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push('/admin/main-menus/create')}
              size="large"
            >
              新建菜单
            </Button>
          </Col>
        </Row>
        {error && <Alert message="错误" description={error} type="error" showIcon style={{ marginBottom: 16 }} />}
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={menus}
            rowKey="id"
            scroll={{ x: 900 }}
          />
        </Spin>
      </Card>
    </div>
  )
}

export default withPagePermission(MainMenusPage, {
  permission: 'main-menu.read'
})
