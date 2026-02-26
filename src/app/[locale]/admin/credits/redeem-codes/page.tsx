'use client'

import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined, CopyOutlined } from '@ant-design/icons'
import { Table, Tag, Button, message, Popconfirm, Space, Card } from 'antd'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useState } from 'react'

import { useRouter } from '@/i18n/navigation'
import { withPagePermission } from '@/lib/withPagePermission'

interface RedeemCode {
  id: number
  code: string
  credits: number
  maxUses: number
  usedCount: number
  status: string
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  creator?: {
    name: string
    email: string
  }
  history: Array<{
    user: {
      name: string
      email: string
    }
  }>
}

const RedeemCodesPage = () => {
  const t = useTranslations('admin')
  const router = useRouter()
  const [codes, setCodes] = useState<RedeemCode[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })

  const fetchCodes = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', pagination.current.toString())
      params.set('limit', pagination.pageSize.toString())
      const response = await fetch(`/api/admin/credits/redeem-codes?${params.toString()}`)
      if (!response.ok) {
        throw new Error('获取兑换码列表失败')
      }
      const result = await response.json()
      setCodes(result.data)
      setTotal(result.totalCount)
    } catch (err: any) {
      message.error(err.message)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [pagination])

  useEffect(() => {
    fetchCodes()
  }, [fetchCodes])



  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/credits/redeem-codes/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const res = await response.json()
        throw new Error(res.error || '删除失败')
      }
      
      message.success('删除成功')
      fetchCodes(false)
    } catch (err: any) {
      message.error(err.message)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    message.success('兑换码已复制')
  }



  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    })
  }

  const columns: TableProps<RedeemCode>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '兑换码',
      dataIndex: 'code',
      key: 'code',
      width: 180,
      render: (code) => (
        <Space>
          <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{code}</span>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyCode(code)}
          />
        </Space>
      ),
    },
    {
      title: '次数',
      dataIndex: 'credits',
      key: 'credits',
      width: 100,
      render: (credits) => <Tag color="blue">{credits} 次</Tag>,
    },
    {
      title: '最大使用次数',
      dataIndex: 'maxUses',
      key: 'maxUses',
      width: 120,
    },
    {
      title: '已使用次数',
      dataIndex: 'usedCount',
      key: 'usedCount',
      width: 120,
    },
    {
      title: '使用进度',
      key: 'usage',
      width: 120,
      render: (_, record) => (
        <span>
          {record.usedCount} / {record.maxUses}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusConfig: Record<string, { color: string; text: string }> = {
          active: { color: 'green', text: '可用' },
          inactive: { color: 'default', text: '未激活' },
          expired: { color: 'orange', text: '已过期' },
          used_up: { color: 'red', text: '已用完' },
        }
        const config = statusConfig[status] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 180,
      render: (text) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '永久有效'),
    },
    {
      title: '创建人',
      key: 'creator',
      width: 120,
      render: (_, record) => record.creator?.name || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/credits/redeem-codes/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个兑换码吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
            disabled={record.usedCount > 0}
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              danger
              disabled={record.usedCount > 0}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '24px 32px',
          borderRadius: 12,
          marginBottom: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>次数兑换码管理</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>创建和管理次数兑换码</p>
      </div>

      <Card
        bordered={false}
        style={{
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push('/admin/credits/redeem-codes/create')}
          >
            创建兑换码
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={codes}
          rowKey="id"
          pagination={{ ...pagination, total, showSizeChanger: true }}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}

export default withPagePermission(RedeemCodesPage, {
  permission: 'credits-redeem.read',
})
