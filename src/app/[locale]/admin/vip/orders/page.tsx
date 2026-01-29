'use client'

import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import {
  Table, Tag, message, Spin, Alert, Typography, Button,
  Popconfirm, Space, Modal, Input, Select, Row, Col, Form, Card,
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import { debounce } from 'lodash'
import { useTranslations } from 'next-intl'
import React, { useState, useEffect, useCallback } from 'react'
import { withPagePermission } from '@/lib/withPagePermission'

const { Text } = Typography
const { TextArea } = Input
const { Option } = Select

interface User {
  name: string | null;
  email: string | null;
}

interface Plan {
  name: string | null;
}

interface OrderDataType {
  id: string;
  key: string;
  orderNo: string;
  user: User;
  plan: Plan;
  amount: string;
  status: string;
  userSubmittedTransactionId: string | null;
  createdAt: string;
  adminNotes: string | null;
  paymentMethod: string | null;
  paymentTransactionId: string | null;
  reviewedBy: { name: string | null } | null;
  reviewedAt: string | null;
  updatedAt: string;
  paidAt: string | null;
  expireAt: string | null;
  autoRenew: boolean;
}

interface PlanDataType {
  id: number;
  name:string;
}

interface UserDataType {
    id: string;
    name: string | null;
    email: string | null;
}

const statusColorMap: { [key: string]: string } = {
  pending: 'orange',
  in_review: 'processing',
  completed: 'success',
  rejected: 'error',
  cancelled: 'default',
  refunded: 'magenta',
}

const VipOrdersPage = () => {
  const t = useTranslations('admin.orderManagement')

  const [orders, setOrders] = useState<OrderDataType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const [isApprovalModalVisible, setIsApprovalModalVisible] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderDataType | null>(null)

  const [filters, setFilters] = useState({ status: '', search: '' })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  const [isGrantModalVisible, setIsGrantModalVisible] = useState(false)
  const [granting, setGranting] = useState(false)
  const [searchResultUsers, setSearchResultUsers] = useState<UserDataType[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [plans, setPlans] = useState<PlanDataType[]>([])
  const [grantForm] = Form.useForm()


  const fetchOrders = useCallback(
    async (page: number, pageSize: number, status: string, search: string) => {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })
      if (status) params.append('status', status)
      if (search) params.append('search', search)

      try {
        const response = await fetch(`/api/admin/vip/orders?${params.toString()}`)
        if (!response.ok) {
          throw new Error(t('messages.fetchFailed'))
        }
        const { data, pagination: newPagination } = await response.json()
        setOrders(data.map((order: any) => ({ ...order, key: order.id })))
        setPagination({
          current: newPagination.page,
          pageSize: newPagination.pageSize,
          total: newPagination.total,
        })
      } catch (err: any) {
        setError(err.message)
        message.error(t('messages.fetchFailed'))
      } finally {
        setLoading(false)
      }
    },
    [t],
  )

  const debouncedFetch = useCallback(debounce(fetchOrders, 500), [fetchOrders])

  useEffect(() => {
    debouncedFetch(pagination.current, pagination.pageSize, filters.status, filters.search)
  }, [filters, pagination.current, pagination.pageSize, debouncedFetch])

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/vip/plans')
      if (!response.ok) throw new Error(t('messages.fetchPlansFailed'))
      const data = await response.json()
      const activePlans = data.filter((plan: any) => plan.status === true)
      setPlans(activePlans)
    } catch (error) {
      message.error(t('messages.fetchPlansFailed'))
    }
  }, [t])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])


  const handleTableChange: TableProps<OrderDataType>['onChange'] = (newPagination) => {
    setPagination(prev => ({
      ...prev,
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    }))
  }

  const handleFilterChange = (key: string, value: string) => {
    setPagination(prev => ({ ...prev, current: 1 })) // Reset to first page on filter change
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const showApproveModal = (order: OrderDataType) => {
    setSelectedOrder(order)
    setApprovalNotes('')
    setIsApprovalModalVisible(true)
  }

  const handleApprove = async () => {
    if (!selectedOrder) return
    setUpdating(selectedOrder.id)
    try {
      const response = await fetch(`/api/admin/vip/orders/${selectedOrder.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: approvalNotes }),
      })
      if (!response.ok) throw new Error(t('messages.approveFailed'))
      message.success(t('messages.approveSuccess'))
      setIsApprovalModalVisible(false)
      fetchOrders(pagination.current, pagination.pageSize, filters.status, filters.search)
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setUpdating(null)
    }
  }

  const showRejectModal = (order: OrderDataType) => {
    setSelectedOrder(order)
    setIsRejectModalVisible(true)
    setRejectionReason('')
  }

  const handleReject = async () => {
    if (!selectedOrder || !rejectionReason.trim()) {
      message.error(t('rejectModal.reasonRequired'))
      return
    }
    setUpdating(selectedOrder.id)
    try {
      const response = await fetch(`/api/admin/vip/orders/${selectedOrder.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('messages.rejectFailed'))
      }
      message.success(t('messages.rejectSuccess'))
      setIsRejectModalVisible(false)
      setRejectionReason('')
      fetchOrders(pagination.current, pagination.pageSize, filters.status, filters.search)
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setUpdating(null)
    }
  }

  const searchUsers = async (query: string) => {
    if (!query) {
      setSearchResultUsers([])
      return
    }
    setSearchingUsers(true)
    try {
      const response = await fetch(`/api/admin/users/search?query=${query}`)
      const data = await response.json()
      setSearchResultUsers(data)
    } catch (err) {
      message.error(t('messages.userSearchFailed'))
    } finally {
      setSearchingUsers(false)
    }
  }

  const debouncedUserSearch = useCallback(debounce(searchUsers, 300), [])

  const handleGrantVip = async (values: any) => {
    setGranting(true)
    try {
      const response = await fetch('/api/admin/vip/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || t('messages.grantVipFailed'))
      }
      message.success(t('messages.grantVipSuccess'))
      setIsGrantModalVisible(false)
      grantForm.resetFields()
      fetchOrders(pagination.current, pagination.pageSize, filters.status, filters.search)
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setGranting(false)
    }
  }


  const columns: ColumnsType<OrderDataType> = [
    {
        title: t('columns.orderNo'),
        dataIndex: 'orderNo',
        key: 'orderNo',
        width: 180,
    },
    {
        title: t('columns.user'),
        dataIndex: 'user',
        key: 'user',
        render: (user: User) => `${user.name} (${user.email})`,
        width: 200,
    },
    {
        title: t('columns.plan'),
        dataIndex: 'plan',
        key: 'plan',
        render: (plan: Plan) => plan?.name || '-',
    },
    {
        title: t('columns.amount'),
        dataIndex: 'amount',
        key: 'amount',
        render: (amount: string) => `¥${parseFloat(amount).toFixed(2)}`,
    },
    {
      title: t('columns.paymentMethod'),
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (paymentMethod: string | null) => {
        const paymentMethodMap: { [key: string]: string } = {
          alipay: '支付宝',
          wechat: '微信支付',
          bank: '银行卡汇款',
        }
        return paymentMethod ? paymentMethodMap[paymentMethod] || paymentMethod : '-'
      },
    },
    {
        title: t('columns.status'),
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => (
          <Tag color={statusColorMap[status] || 'default'}>
            {t(`status.${status}`)}
          </Tag>
        ),
        filters: [
          { text: t('status.pending'), value: 'pending' },
          { text: t('status.in_review'), value: 'in_review' },
          { text: t('status.completed'), value: 'completed' },
          { text: t('status.rejected'), value: 'rejected' },
          { text: t('status.cancelled'), value: 'cancelled' },
          { text: t('status.refunded'), value: 'refunded' },
        ],
        onFilter: (value: any, record) => record.status === value,
    },
    {
      title: t('columns.userSubmittedId'),
      dataIndex: 'userSubmittedTransactionId',
      key: 'userSubmittedTransactionId',
      render: (id) => id || '-',
    },
    {
      title: t('columns.paymentTransactionId'),
      dataIndex: 'paymentTransactionId',
      key: 'paymentTransactionId',
      render: (id) => id || '-',
    },
    {
      title: t('columns.adminNotes'),
      dataIndex: 'adminNotes',
      key: 'adminNotes',
      render: (notes) => notes || '-',
    },
    {
      title: t('columns.paidAt'),
      dataIndex: 'paidAt',
      key: 'paidAt',
      render: (date) => (date ? new Date(date).toLocaleString() : '-'),
    },
    {
      title: t('columns.expireAt'),
      dataIndex: 'expireAt',
      key: 'expireAt',
      render: (date) => (date ? new Date(date).toLocaleString() : '-'),
    },
    {
      title: t('columns.autoRenew'),
      dataIndex: 'autoRenew',
      key: 'autoRenew',
      render: (autoRenew) => (autoRenew ? t('yes') : t('no')),
    },
    {
      title: t('columns.reviewedBy'),
      dataIndex: 'reviewer',
      key: 'reviewer',
      render: (reviewer: { name: string | null } | null) => reviewer?.name || '-',
    },
    {
      title: t('columns.reviewedAt'),
      dataIndex: 'reviewedAt',
      key: 'reviewedAt',
      render: (date) => (date ? new Date(date).toLocaleString() : '-'),
    },
    {
      title: t('columns.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: t('columns.updatedAt'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: t('columns.actions'),
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (text: any, record: OrderDataType) => (
        <Space size="middle">
          {record.status === 'in_review' ? (
            <>
              <Button
                type="primary"
                onClick={() => showApproveModal(record)}
                loading={updating === record.id}
              >
                {t('buttons.approve')}
              </Button>
              <Button
                danger
                onClick={() => showRejectModal(record)}
                loading={updating === record.id}
              >
                {t('buttons.reject')}
              </Button>
            </>
          ) : (
            <Text type="secondary">-</Text>
          )}
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
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col>
                <Select
                    style={{ width: 180 }}
                    placeholder={t('filters.statusPlaceholder')}
                    onChange={(value) => handleFilterChange('status', value)}
                    allowClear
                >
                    <Option value="pending">{t('status.pending')}</Option>
                    <Option value="in_review">{t('status.in_review')}</Option>
                    <Option value="completed">{t('status.completed')}</Option>
                    <Option value="rejected">{t('status.rejected')}</Option>
                    <Option value="cancelled">{t('status.cancelled')}</Option>
                    <Option value="refunded">{t('status.refunded')}</Option>
                </Select>
            </Col>
            <Col>
                <Input.Search
                    placeholder={t('filters.searchPlaceholder')}
                    onSearch={(value) => handleFilterChange('search', value)}
                    style={{ width: 240 }}
                    allowClear
                />
            </Col>
            <Col flex="auto" style={{ textAlign: 'right' }}>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsGrantModalVisible(true)}
                    size="large"
                >
                    {t('buttons.grantVip')}
                </Button>
            </Col>
        </Row>

        {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="key"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1800 }}
        />
      </Card>

      <Modal
        title={t('approveModal.title')}
        open={isApprovalModalVisible}
        onOk={handleApprove}
        onCancel={() => setIsApprovalModalVisible(false)}
        confirmLoading={!!updating}
        okText={t('buttons.confirmApprove')}
        cancelText={t('buttons.cancel')}
      >
        <Form layout="vertical">
          <Form.Item label={t('approveModal.label')}>
            <TextArea
              rows={4}
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder={t('approveModal.placeholder')}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('rejectModal.title')}
        open={isRejectModalVisible}
        onOk={handleReject}
        onCancel={() => setIsRejectModalVisible(false)}
        confirmLoading={!!updating}
        okText={t('buttons.confirmReject')}
        cancelText={t('buttons.cancel')}
      >
        <Form layout="vertical">
          <Form.Item label={t('rejectModal.label')} required>
            <TextArea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t('rejectModal.placeholder')}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('grantModal.title')}
        open={isGrantModalVisible}
        onCancel={() => setIsGrantModalVisible(false)}
        footer={null}
      >
        <Form form={grantForm} layout="vertical" onFinish={handleGrantVip} style={{marginTop: 24}}>
          <Form.Item
            name="userId"
            label={t('grantModal.userLabel')}
            rules={[{ required: true, message: t('grantModal.userRequired') }]}
          >
            <Select
              showSearch
              placeholder={t('grantModal.userPlaceholder')}
              onSearch={debouncedUserSearch}
              loading={searchingUsers}
              filterOption={false}
              notFoundContent={searchingUsers ? <Spin size="small" /> : null}
            >
              {searchResultUsers.map(user => (
                <Option key={user.id} value={user.id}>{`${user.name} (${user.email})`}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="planId"
            label={t('grantModal.planLabel')}
            rules={[{ required: true, message: t('grantModal.planRequired') }]}
          >
            <Select placeholder={t('grantModal.planPlaceholder')}>
              {plans.map(plan => (
                <Option key={plan.id} value={plan.id}>{plan.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="adminNotes" label={t('grantModal.notesLabel')}>
            <TextArea rows={3} placeholder={t('grantModal.notesPlaceholder')} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={granting} block>
              {t('buttons.confirmGrant')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

// 使用页面级权限校验
export default withPagePermission(VipOrdersPage, {
  permission: 'order.read'
})
