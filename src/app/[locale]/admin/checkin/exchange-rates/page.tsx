'use client'

import { useState, useEffect } from 'react'
import { Button, Table, Tag, Space, message, Switch, Card, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import type { ColumnsType } from 'antd/es/table'
import { withPagePermission } from '@/lib/withPagePermission'

interface ExchangeRate {
  id: number
  name: string
  pointsRequired: number
  creditsReceived: number
  description: string
  status: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

function ExchangeRatesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rates, setRates] = useState<ExchangeRate[]>([])
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null)

  useEffect(() => {
    fetchRates()
  }, [])

  const fetchRates = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/checkin/exchange-rates')
      const data = await res.json()
      if (data.success) {
        setRates(data.data)
      } else {
        message.error(data.error || '获取兑换比例失败')
      }
    } catch (error) {
      console.error('获取兑换比例失败:', error)
      message.error('获取兑换比例失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (record: ExchangeRate) => {
    try {
      const res = await fetch(`/api/admin/checkin/exchange-rates/${record.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        message.success('删除成功')
        fetchRates()
      } else {
        message.error(data.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  const handleStatusChange = async (id: number, checked: boolean) => {
    setUpdatingStatus(id)
    try {
      const rate = rates.find(r => r.id === id)
      if (!rate) return

      const res = await fetch(`/api/admin/checkin/exchange-rates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rate,
          status: checked ? 'active' : 'inactive',
        }),
      })
      const data = await res.json()
      if (data.success) {
        message.success('状态更新成功')
        setRates(prevRates =>
          prevRates.map(r => (r.id === id ? { ...r, status: checked ? 'active' : 'inactive' } : r))
        )
      } else {
        message.error(data.error || '状态更新失败')
      }
    } catch (error) {
      console.error('状态更新失败:', error)
      message.error('状态更新失败')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const columns: ColumnsType<ExchangeRate> = [
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      sorter: (a, b) => a.sortOrder - b.sortOrder,
    },
    {
      title: '配置名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '所需积分',
      dataIndex: 'pointsRequired',
      key: 'pointsRequired',
      width: 120,
      render: (points: number) => (
        <Tag color="purple">{points} 积分</Tag>
      ),
      sorter: (a, b) => a.pointsRequired - b.pointsRequired,
    },
    {
      title: '获得次数',
      dataIndex: 'creditsReceived',
      key: 'creditsReceived',
      width: 120,
      render: (credits: number) => (
        <Tag color="pink">{credits} 次</Tag>
      ),
      sorter: (a, b) => a.creditsReceived - b.creditsReceived,
    },
    {
      title: '兑换比例',
      key: 'ratio',
      width: 150,
      render: (_: any, record: ExchangeRate) => (
        <span className="font-bold">
          {record.pointsRequired}积分 = {record.creditsReceived}次
        </span>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: ExchangeRate) => (
        <Switch
          checked={status === 'active'}
          onChange={(checked) => handleStatusChange(record.id, checked)}
          loading={updatingStatus === record.id}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: ExchangeRate) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/checkin/exchange-rates/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除配置"${record.name}"吗？`}
            onConfirm={() => handleDelete(record)}
            okText="确认"
            cancelText="取消"
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
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
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>积分兑换比例管理</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>管理积分兑换次数的比例配置</p>
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
            size="large"
            onClick={() => router.push('/admin/checkin/exchange-rates/create')}
            style={{
              height: 40,
              borderRadius: 6,
              fontSize: 14,
            }}
          >
            新建配置
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={rates}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>
    </div>
  )
}


export default withPagePermission(ExchangeRatesPage, 'exchange-rate.read')
