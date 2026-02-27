'use client'

import { useState, useEffect } from 'react'
import { Button, Table, Tag, Space, Modal, message, Switch, Card, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import type { ColumnsType } from 'antd/es/table'
import { withPagePermission } from '@/lib/withPagePermission'

interface CheckInRule {
  id: number
  name: string
  consecutiveDays: number
  points: number
  description: string
  status: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

function CheckInRulesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rules, setRules] = useState<CheckInRule[]>([])
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null)

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/checkin/rules')
      const data = await res.json()
      if (data.success) {
        setRules(data.data)
      } else {
        message.error(data.error || '获取签到规则失败')
      }
    } catch (error) {
      console.error('获取签到规则失败:', error)
      message.error('获取签到规则失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (record: CheckInRule) => {
    try {
      const res = await fetch(`/api/admin/checkin/rules/${record.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        message.success('删除成功')
        fetchRules()
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
      const rule = rules.find(r => r.id === id)
      if (!rule) return

      const res = await fetch(`/api/admin/checkin/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rule,
          status: checked ? 'active' : 'inactive',
        }),
      })
      const data = await res.json()
      if (data.success) {
        message.success('状态更新成功')
        setRules(prevRules =>
          prevRules.map(r => (r.id === id ? { ...r, status: checked ? 'active' : 'inactive' } : r))
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

  const columns: ColumnsType<CheckInRule> = [
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      sorter: (a, b) => a.sortOrder - b.sortOrder,
    },
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '连续天数',
      dataIndex: 'consecutiveDays',
      key: 'consecutiveDays',
      width: 120,
      render: (days: number) => (
        <Tag color="blue">{days} 天</Tag>
      ),
      sorter: (a, b) => a.consecutiveDays - b.consecutiveDays,
    },
    {
      title: '奖励积分',
      dataIndex: 'points',
      key: 'points',
      width: 120,
      render: (points: number) => (
        <Tag color="purple">+{points} 积分</Tag>
      ),
      sorter: (a, b) => a.points - b.points,
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
      render: (status: string, record: CheckInRule) => (
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
      render: (_: any, record: CheckInRule) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/checkin/rules/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除规则"${record.name}"吗？`}
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
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>签到规则管理</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>管理签到奖励规则，设置不同连续签到天数的积分奖励</p>
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
            onClick={() => router.push('/admin/checkin/rules/create')}
            style={{
              height: 40,
              borderRadius: 6,
              fontSize: 14,
            }}
          >
            新建规则
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={rules}
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

export default withPagePermission(CheckInRulesPage, 'checkin-rule.read')
