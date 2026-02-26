'use client'

import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { Table, Tag, Button, message, Popconfirm, Space, Card } from 'antd'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'
import React, { useCallback, useEffect, useState } from 'react'

import { useRouter } from '@/i18n/navigation'
import { withPagePermission } from '@/lib/withPagePermission'

interface RedeemHistory {
  id: number
  code: string
  credits: number
  status: string
  message: string | null
  redeemedAt: string
  user: {
    id: string
    name: string | null
    email: string | null
  }
}

const RedeemHistoryPage = () => {
  const router = useRouter()
  const [records, setRecords] = useState<RedeemHistory[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })

  const fetchRecords = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', pagination.current.toString())
      params.set('limit', pagination.pageSize.toString())
      const response = await fetch(`/api/admin/credits/redeem-history?${params.toString()}`)
      if (!response.ok) {
        throw new Error('获取兑换历史失败')
      }
      const result = await response.json()
      setRecords(result.data)
      setTotal(result.totalCount)
    } catch (err: any) {
      message.error(err.message)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [pagination])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/credits/redeem-history/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const res = await response.json()
        throw new Error(res.error || '删除失败')
      }
      
      message.success('删除成功')
      fetchRecords(false)
    } catch (err: any) {
      message.error(err.message)
    }
  }

  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    })
  }

  const columns: TableProps<RedeemHistory>['columns'] = [
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
      width: 150,
      render: (code) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{code}</span>
      ),
    },
    {
      title: '用户',
      key: 'user',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.user?.name || '未知用户'}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.user?.email}</div>
        </div>
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status, record) => (
        <div>
          <Tag color={status === 'success' ? 'green' : 'red'}>
            {status === 'success' ? '成功' : '失败'}
          </Tag>
          {record.message && (
            <div style={{ fontSize: 12, color: '#ff4d4f', marginTop: 4 }}>
              {record.message}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '兑换时间',
      dataIndex: 'redeemedAt',
      key: 'redeemedAt',
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
            onClick={() => router.push(`/admin/credits/redeem-history/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这条兑换记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              danger
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
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>兑换历史管理</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>查看和管理所有兑换记录</p>
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
            onClick={() => router.push('/admin/credits/redeem-history/create')}
          >
            新建记录
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={records}
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

export default withPagePermission(RedeemHistoryPage, {
  permission: 'credits-history.read',
})
