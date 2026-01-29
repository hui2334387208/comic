'use client'

import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { Table, Tag, Button, message, Popconfirm, Space, Typography, Card, Alert } from 'antd'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useState } from 'react'

import { useRouter } from '@/i18n/navigation'
import { withPagePermission } from '@/lib/withPagePermission'


interface RedeemCode {
  id: number;
  code: string;
  plan: { name: string };
  duration: number;
  isActive: boolean;
  usedCount: number;
  maxUses: number;
  createdAt: string;
  history: { user: { name:string; email: string } }[];
  type: string;
  days: number;
  vipLevel: number;
  expiresAt: string;
  updatedAt: string;
  status: string;
}

const { Title } = Typography

const RedeemCodesPage = () => {
  const t = useTranslations('admin')
  const router = useRouter()
  const [codes, setCodes] = useState<RedeemCode[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [error, setError] = useState<string | null>(null)

  const fetchCodes = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', pagination.current.toString())
      params.set('pageSize', pagination.pageSize.toString())
      const response = await fetch(`/api/admin/vip/redeem?${params.toString()}`)
      if (!response.ok) {
        throw new Error(t('vip.redeem.messages.fetchFailed'))
      }
      const result = await response.json()
      setCodes(result.data)
      setTotal(result.total)
    } catch (err: any) {
      setError(err.message)
      message.error(err.message)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [pagination, t])

  useEffect(() => {
    fetchCodes()
  }, [fetchCodes])

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/vip/redeem/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const res = await response.json()
        throw new Error(res.error || t('vip.redeem.messages.deleteFailed'))
      }
      message.success(t('vip.redeem.messages.deleteSuccess'))
      fetchCodes(false)
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

  const columns: TableProps<RedeemCode>['columns'] = [
    { title: t('vip.redeem.code'), dataIndex: 'code', key: 'code' },
    { title: t('vip.redeem.type'), dataIndex: 'type', key: 'type', render: (type) => t(`vip.redeem.typeOptions.${type}`) },
    { title: t('vip.plan.name'), dataIndex: ['plan', 'name'], key: 'plan' },
    { title: t('vip.plan.duration'), dataIndex: 'duration', key: 'duration', render: (d) => d ? `${d} ${t('common.months')}` : '-' },
    { title: t('vip.redeem.days'), dataIndex: 'days', key: 'days', render: (d) => d ? `${d} ${t('common.days')}` : '-' },
    { title: t('vip.redeem.vipLevel'), dataIndex: 'vipLevel', key: 'vipLevel', render: (v) => v || '-' },
    { title: t('vip.redeem.usage'), key: 'usage', render: (_, record) => `${record.usedCount}/${record.maxUses}` },
    { title: t('vip.redeem.status'), dataIndex: 'status', key: 'status', render: (status) => {
      let color = 'default'
      let displayStatus = status
      if (status === true) displayStatus = 'active'
      else if (status === false) displayStatus = 'inactive'
      if (displayStatus === 'active') color = 'green'
      else if (displayStatus === 'inactive') color = 'red'
      else if (displayStatus === 'expired') color = 'orange'
      else if (displayStatus === 'used_up') color = 'volcano'
      return <Tag color={color}>{t(`vip.redeem.statusOptions.${displayStatus}`)}</Tag>
    } },
    { title: t('vip.redeem.expiresAt'), dataIndex: 'expiresAt', key: 'expiresAt', render: (text) => text ? dayjs(text).format('YYYY-MM-DD') : '-' },
    { title: t('common.createdAt'), dataIndex: 'createdAt', key: 'createdAt', render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss')},
    {
      title: t('common.actions'),
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/vip/redeem/edit/${record.id}`)}
            disabled={record.usedCount > 0 || record.status === 'used_up'}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('vip.redeem.deleteConfirm.title')}
            description={t('vip.redeem.deleteConfirm.description')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
            disabled={record.usedCount > 0 || record.status === 'used_up'}
          >
            <Button
              icon={<DeleteOutlined />}
              danger
              disabled={record.usedCount > 0 || record.status === 'used_up'}
            >
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />
  }

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
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>{t('vip.redeem.manageTitle')}</h1>
            <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>{t('vip.redeem.manageDescription')}</p>
        </div>
        <Card
            bordered={false}
            style={{
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/admin/vip/redeem/create')}>
                    {t('vip.redeem.createButton')}
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
  permission: 'redeem.read'
})
