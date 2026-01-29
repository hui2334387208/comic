'use client'

import { ClockCircleOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons'
import { Table, Button, Tag, message, Select, Space, Popconfirm, Modal, Form, Input, Card, Row, Col, Statistic } from 'antd'
import { useRouter , useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { withPagePermission } from '@/lib/withPagePermission'

interface Feedback {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  content: string;
  language: string;
  status: 'pending' | 'processing' | 'completed';
  createdAt: string;
}

function FeedbackPage() {
  const t = useTranslations('admin')
  const params = useParams()
  const currentLocale = params.locale as string
  const [data, setData] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('all')
  const [language, setLanguage] = useState(currentLocale)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentFeedback, setCurrentFeedback] = useState<Feedback | null>(null)
  const [form] = Form.useForm()
  const router = useRouter()

  const statusOptions = [
    { value: 'all', label: t('common.all') },
    { value: 'pending', label: t('feedback.status.pending') },
    { value: 'processing', label: t('feedback.status.processing') },
    { value: 'completed', label: t('feedback.status.completed') },
  ]

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'zh', label: '中文' },
  ]

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/feedback?language=${language}`)
      const list = await res.json()
      setData(list)
    } catch {
      message.error(t('common.error'))
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [language])

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/admin/feedback/${id}`, { method: 'DELETE' })
      message.success(t('common.deleteSuccess'))
      fetchData()
    } catch {
      message.error(t('common.deleteError'))
    }
  }

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      message.success(t('common.updateSuccess'))
      fetchData()
    } catch {
      message.error(t('common.operationFailed'))
    }
  }

  const showDetail = (record: Feedback) => {
    setCurrentFeedback(record)
    setModalVisible(true)
    form.setFieldsValue(record)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      if (currentFeedback) {
        await fetch(`/api/admin/feedback/${currentFeedback.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        message.success(t('common.updateSuccess'))
        setModalVisible(false)
        fetchData()
      }
    } catch (error) {
      console.error(t('common.error'), error)
    }
  }

  const getStatistics = () => {
    const total = data.length
    const pending = data.filter(item => item.status === 'pending').length
    const processing = data.filter(item => item.status === 'processing').length
    const completed = data.filter(item => item.status === 'completed').length

    return { total, pending, processing, completed }
  }

  const stats = getStatistics()

  const columns = [
    { title: t('feedback.sender'), dataIndex: 'name', width: 120 },
    {
      title: t('feedback.contact'),
      width: 150,
      render: (_: any, r: Feedback) => (
        <>
          {r.phone && <div>{r.phone}</div>}
          {r.email && <div>{r.email}</div>}
        </>
      ),
    },
    {
      title: t('feedback.content'),
      dataIndex: 'content',
      ellipsis: true,
      width: 300,
    },
    {
      title: t('common.language'),
      dataIndex: 'language',
      width: 100,
      render: (v: string) => languageOptions.find(opt => opt.value === v)?.label || v,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      width: 120,
      render: (v: string, record: Feedback) => (
        <Select
          value={v}
          style={{ width: 100 }}
          onChange={(value) => handleStatusChange(record.id, value)}
          options={statusOptions.filter(opt => opt.value !== 'all')}
        />
      ),
    },
    {
      title: t('feedback.submitTime'),
      dataIndex: 'createdAt',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: t('common.actions'),
      width: 120,
      render: (_: any, r: Feedback) => (
        <Space>
          <Button type="link" onClick={() => showDetail(r)}>{t('common.details')}</Button>
          <Popconfirm
            title={t('common.deleteConfirm')}
            onConfirm={() => handleDelete(r.id)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
          >
            <Button type="link" danger>{t('common.delete')}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const filteredData = status === 'all'
    ? data
    : data.filter(item => item.status === status)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">{t('feedback.title')}</h1>
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title={t('feedback.totalFeedback')}
                value={stats.total}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={t('feedback.status.pending')}
                value={stats.pending}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={t('feedback.status.processing')}
                value={stats.processing}
                valueStyle={{ color: '#1890ff' }}
                prefix={<SyncOutlined spin />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={t('feedback.status.completed')}
                value={stats.completed}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <div className="mb-4 flex justify-end space-x-4">
        <Select
          value={language}
          options={languageOptions}
          onChange={setLanguage}
          style={{ width: 120 }}
        />
        <Select
          value={status}
          options={statusOptions}
          onChange={setStatus}
          style={{ width: 120 }}
        />
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `${t('common.total')}: ${total}`,
        }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={t('feedback.feedbackDetails')}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={currentFeedback || {}}
        >
          <Form.Item name="name" label={t('feedback.sender')}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="phone" label={t('feedback.phone')}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="email" label={t('feedback.email')}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="content" label={t('feedback.content')}>
            <Input.TextArea rows={4} disabled />
          </Form.Item>
          <Form.Item name="language" label={t('common.language')}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="status" label={t('common.status')}>
            <Select options={statusOptions.filter(opt => opt.value !== 'all')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default withPagePermission(FeedbackPage, {
  permissions: ['feedback.read'],
  requireAll: false
})
