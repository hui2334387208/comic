'use client'

import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import {
  Table, message, Spin, Alert, Typography, Button,
  Space, Switch, Popconfirm, Modal, Card, Tooltip,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useState, useEffect, useCallback } from 'react'
import { withPagePermission } from '@/lib/withPagePermission'

const { Text } = Typography

interface Operator {
  id: string;
  name: string | null;
  email: string | null;
}

interface PlanDataType {
  id: number;
  name: string;
  price: string;
  originalPrice: string | null;
  duration: number;
  status: boolean;
  sortOrder: number;
  createdAt: string;
  operator: Operator | null;
}

interface DeleteErrorResponse {
  error: string;
  message: string;
  dependencies: {
    orders: number;
    codes: number;
  };
}

const PlansPage = () => {
  const t = useTranslations('admin.planManagement')

  const router = useRouter()
  const [plans, setPlans] = useState<PlanDataType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [deleteError, setDeleteError] = useState<DeleteErrorResponse | null>(null)
  const [planToDelete, setPlanToDelete] = useState<PlanDataType | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null)

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/vip/plans')
      if (!response.ok) throw new Error(t('messages.fetchFailed'))
      const data = await response.json()
      setPlans(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const handleStatusChange = async (planId: number, newStatus: boolean) => {
    setUpdatingStatus(planId)
    try {
      const response = await fetch(`/api/admin/vip/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) {
        throw new Error(t('messages.updateFailed'))
      }
      message.success(t('messages.updateSuccess'))
      setPlans(prevPlans =>
        prevPlans.map(p => (p.id === planId ? { ...p, status: newStatus } : p)),
      )
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleDelete = async (plan: PlanDataType) => {
    setPlanToDelete(plan)
    setDeleteError(null)
    setDeleteModalVisible(true)
  }

  const confirmDelete = async () => {
    if (!planToDelete) return

    try {
      const response = await fetch(`/api/admin/vip/plans/${planToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400 && data.error === 'Cannot delete plan with dependencies') {
          setDeleteError(data)
          return
        }
        throw new Error(data.error || 'Failed to delete plan.')
      }

      message.success(data.message || 'Plan deleted successfully!')
      setDeleteModalVisible(false)
      setPlanToDelete(null)
      fetchPlans()
    } catch (err: any) {
      message.error(err.message)
      setDeleteModalVisible(false)
      setPlanToDelete(null)
    }
  }

  const columns: ColumnsType<PlanDataType> = [
    {
      title: t('columns.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('columns.price'),
      dataIndex: 'price',
      key: 'price',
      render: (p) => `¥${parseFloat(p).toFixed(2)}`,
      sorter: (a, b) => parseFloat(a.price) - parseFloat(b.price),
    },
    {
      title: t('columns.originalPrice'),
      dataIndex: 'originalPrice',
      key: 'originalPrice',
      render: (p) => (p ? `¥${parseFloat(p).toFixed(2)}` : '-'),
      sorter: (a, b) => parseFloat(a.originalPrice || '0') - parseFloat(b.originalPrice || '0'),
    },
    {
      title: t('columns.duration'),
      dataIndex: 'duration',
      key: 'duration',
      render: (d) => `${d} ${t('durationUnit')}`,
      sorter: (a, b) => a.duration - b.duration,
    },
    {
      title: t('columns.sortOrder'),
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      sorter: (a, b) => a.sortOrder - b.sortOrder,
    },
    {
      title: t('columns.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: t('columns.operator'),
      dataIndex: 'operator',
      key: 'operator',
      render: (operator: Operator | null) => {
        if (!operator) return '-'
        return (
          <Tooltip title={operator.email}>
            <span>{operator.name || 'N/A'}</span>
          </Tooltip>
        )
      },
    },
    {
      title: t('columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Switch
          checked={status}
          onChange={(checked) => handleStatusChange(record.id, checked)}
          loading={updatingStatus === record.id}
        />
      ),
    },
    {
      title: t('columns.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/vip/plans/edit/${record.id}`)}
          >
            {t('buttons.edit')}
          </Button>
          <Popconfirm
            title={t('deleteConfirm.title')}
            description={t('deleteConfirm.description', { name: record.name })}
            onConfirm={() => handleDelete(record)}
            okText={t('buttons.confirm')}
            cancelText={t('buttons.cancel')}
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
          >
            <Button icon={<DeleteOutlined />} danger>
              {t('buttons.delete')}
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
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>{t('title')}</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>{t('description')}</p>
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
            onClick={() => router.push('/admin/vip/plans/create')}
            style={{
              height: 40,
              borderRadius: 6,
              fontSize: 14,
            }}
          >
            {t('createPlan')}
          </Button>
        </div>

        {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Table
          columns={columns}
          dataSource={plans}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 删除确认模态框 */}
      <Modal
        title={deleteError ? t('deleteModal.errorTitle') : t('deleteModal.title')}
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false)
          setPlanToDelete(null)
          setDeleteError(null)
        }}
        okText={t('buttons.delete')}
        cancelText={t('buttons.cancel')}
        okButtonProps={{ danger: true }}
      >
        {deleteError ? (
          <div>
            <Alert
              message={t('deleteModal.errorMessage')}
              description={deleteError.message}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <div style={{ marginBottom: 16 }}>
              <Text strong>{t('deleteModal.dependencyInfo')}</Text>
              <ul style={{ marginTop: 8 }}>
                {deleteError.dependencies.orders > 0 && (
                  <li>{t('deleteModal.orders', { count: deleteError.dependencies.orders })}</li>
                )}
                {deleteError.dependencies.codes > 0 && (
                  <li>{t('deleteModal.codes', { count: deleteError.dependencies.codes })}</li>
                )}
              </ul>
            </div>
            <Text type="secondary">
              {t('deleteModal.suggestion')}
            </Text>
          </div>
        ) : (
          <div>
            <p>{t('deleteModal.confirmText', { name: planToDelete?.name ?? '' })}</p>
            <p style={{ color: '#ff4d4f' }}>
              {t('deleteModal.warning')}
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default withPagePermission(PlansPage, {
  permissions: ['system.read'],
  requireAll: false
})
