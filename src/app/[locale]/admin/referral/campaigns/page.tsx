'use client'

import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  message,
  Popconfirm,
  Tag,
  Switch,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
import { withPagePermission } from '@/lib/withPagePermission'

interface Campaign {
  id: number
  name: string
  description?: string
  inviterReward: number
  inviteeReward: number
  requirementType: string
  isActive: boolean
  startDate?: string
  endDate?: string
  maxInvitesPerUser?: number
  createdAt: string
  updatedAt: string
}

function ReferralCampaignsPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/referral/campaigns')

      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns)
      } else {
        message.error('获取活动列表失败')
      }
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/referral/campaigns/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        message.success('删除成功')
        fetchData()
      } else {
        const data = await res.json()
        message.error(data.error || '删除失败')
      }
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleToggleActive = async (id: number, checked: boolean) => {
    try {
      const campaign = campaigns.find(c => c.id === id)
      if (!campaign) return

      const res = await fetch(`/api/admin/referral/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...campaign,
          isActive: checked,
        }),
      })

      if (res.ok) {
        message.success(checked ? '活动已激活' : '活动已停用')
        fetchData()
      } else {
        const data = await res.json()
        message.error(data.error || '更新失败')
      }
    } catch (error) {
      message.error('更新失败')
    }
  }

  const getRequirementTypeText = (type: string) => {
    const map: Record<string, string> = {
      register: '注册即可',
      verified_email: '验证邮箱',
      first_comic: '首次创作',
    }
    return map[type] || type
  }

  const columns = [
    {
      title: '活动名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Campaign) => (
        <div>
          <div className="font-medium">{text}</div>
          {record.description && (
            <div className="text-sm text-gray-500 mt-1">{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: '奖励配置',
      key: 'rewards',
      render: (_: any, record: Campaign) => (
        <div className="text-sm">
          <div>邀请人: <span className="font-medium">{record.inviterReward}</span> 次</div>
          <div>被邀请人: <span className="font-medium">{record.inviteeReward}</span> 次</div>
          {record.maxInvitesPerUser && (
            <div className="text-gray-500">限制: {record.maxInvitesPerUser} 人</div>
          )}
        </div>
      ),
    },
    {
      title: '任务类型',
      dataIndex: 'requirementType',
      key: 'requirementType',
      render: (type: string) => (
        <Tag color="blue">{getRequirementTypeText(type)}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: Campaign) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleActive(record.id, checked)}
          checkedChildren="激活"
          unCheckedChildren="停用"
        />
      ),
    },
    {
      title: '时间范围',
      key: 'dateRange',
      render: (_: any, record: Campaign) => (
        <div className="text-sm">
          {record.startDate && (
            <div>开始: {new Date(record.startDate).toLocaleDateString()}</div>
          )}
          {record.endDate && (
            <div>结束: {new Date(record.endDate).toLocaleDateString()}</div>
          )}
          {!record.startDate && !record.endDate && (
            <div className="text-gray-500">无限期</div>
          )}
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
      render: (_: any, record: Campaign) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => router.push(`/${locale}/admin/referral/campaigns/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个活动吗？"
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
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">邀请活动管理</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => router.push(`/${locale}/admin/referral/campaigns/create`)}
        >
          创建新活动
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={campaigns}
        rowKey="id"
        loading={loading}
        pagination={false}
        locale={{
          emptyText: '暂无邀请活动，点击上方按钮创建',
        }}
      />
    </div>
  )
}

export default withPagePermission(ReferralCampaignsPage, 'referral-campaign.read')
