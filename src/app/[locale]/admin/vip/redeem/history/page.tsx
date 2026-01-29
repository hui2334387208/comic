'use client'

import { Table, Card, Tag, Alert, Input, Select, Button, Modal, Descriptions, message } from 'antd'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'
import { withPagePermission } from '@/lib/withPagePermission'

interface RedeemHistoryItem {
  id: number;
  userId: string;
  userName?: string;
  code: string;
  status: string;
  message?: string;
  redeemedAt: string;
  snapshot?: any;
}

const pageSize = 20
const statusOptions = [
  { value: '', label: '全部' },
  { value: 'success', label: '成功' },
  { value: 'failed', label: '失败' },
  { value: 'expired', label: '已过期' },
]

function VipRedeemHistoryAdminPage() {
  const t = useTranslations('admin')
  const [data, setData] = useState<RedeemHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [detail, setDetail] = useState<RedeemHistoryItem | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [page, search, status])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
      })
      const res = await fetch(`/api/admin/vip/redeem/history?${params.toString()}`)
      if (!res.ok) throw new Error(t('vip.redeem.history.errorDesc'))
      const result = await res.json()
      setData(result.data || [])
      setTotal(result.total || 0)
    } catch (e: any) {
      setError(e.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams({
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        export: 'true',
      })
      const res = await fetch(`/api/admin/vip/redeem/history?${params.toString()}`)
      if (!res.ok) throw new Error('导出失败')
      const result = await res.json()
      const rows = result.data || []
      if (!rows.length) return message.warning('无可导出的数据')
      // 生成CSV
      const header = ['ID','用户','兑换码','状态','兑换时间','备注']
      const csv = [header.join(',')].concat(
        rows.map((r: RedeemHistoryItem) => [
          r.id,
          r.userName || r.userId,
          r.code,
          r.status,
          r.redeemedAt ? dayjs(r.redeemedAt).format('YYYY-MM-DD HH:mm:ss') : '',
          r.message || '',
        ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')),
      ).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'vip_redeem_history.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      message.error(e.message || '导出失败')
    } finally {
      setExporting(false)
    }
  }

  const columns = [
    { title: t('vip.redeem.history.table.id'), dataIndex: 'id', key: 'id' },
    { title: t('vip.redeem.history.table.user'), dataIndex: 'userName', key: 'userName', render: (v: string, r: RedeemHistoryItem) => v || r.userId },
    { title: t('vip.redeem.history.table.code'), dataIndex: 'code', key: 'code' },
    { title: t('vip.redeem.history.table.status'), dataIndex: 'status', key: 'status', render: (status: string) => {
      let color = 'default'
      if (status === 'success') color = 'green'
      else if (status === 'failed') color = 'red'
      else if (status === 'expired') color = 'orange'
      return <Tag color={color}>{t(`vip.redeem.history.statusOptions.${status}`) || status}</Tag>
    } },
    { title: t('vip.redeem.history.table.redeemedAt'), dataIndex: 'redeemedAt', key: 'redeemedAt', render: (text: string) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-' },
    { title: t('vip.redeem.history.table.message'), dataIndex: 'message', key: 'message', render: (v: string) => v || '-' },
    { title: t('vip.redeem.history.table.snapshot'), dataIndex: 'snapshot', key: 'snapshot', render: (snap: any) => snap ? <Button size="small" onClick={e => { e.stopPropagation(); setDetail({ ...(detail as any), snapshot: snap }) }}>查看</Button> : '-' },
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
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>{t('vip.redeem.history.title')}</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>{t('vip.redeem.history.description')}</p>
      </div>
      <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Input.Search allowClear placeholder="用户/兑换码" style={{ width: 200 }} onSearch={v => { setPage(1); setSearch(v) }} />
          <Select allowClear style={{ width: 120 }} value={status} options={statusOptions} onChange={v => { setPage(1); setStatus(v) }} />
          <Button type="primary" loading={exporting} onClick={handleExport}>导出</Button>
        </div>
        {error && <Alert message={t('vip.redeem.history.error')} description={error} type="error" showIcon style={{ marginBottom: 16 }} />}
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            onChange: setPage,
            showTotal: (total, range) => t('vip.redeem.history.pagination.page', { page, total: Math.ceil(total / pageSize) }),
          }}
          locale={{ emptyText: t('vip.redeem.history.noData') }}
          loading={loading}
          scroll={{ x: 'max-content' }}
          onRow={record => ({ onClick: () => setDetail(record) })}
        />
      </Card>
      <Modal open={!!detail} title="兑换详情" onCancel={() => setDetail(null)} footer={null} width={600}>
        {detail && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label={t('vip.redeem.history.table.id')}>{detail.id}</Descriptions.Item>
            <Descriptions.Item label={t('vip.redeem.history.table.user')}>{detail.userName || detail.userId}</Descriptions.Item>
            <Descriptions.Item label={t('vip.redeem.history.table.code')}>{detail.code}</Descriptions.Item>
            <Descriptions.Item label={t('vip.redeem.history.table.status')}>{t(`vip.redeem.history.statusOptions.${detail.status}`) || detail.status}</Descriptions.Item>
            <Descriptions.Item label={t('vip.redeem.history.table.redeemedAt')}>{detail.redeemedAt ? dayjs(detail.redeemedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
            <Descriptions.Item label={t('vip.redeem.history.table.message')}>{detail.message || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('vip.redeem.history.table.snapshot')}>
              <pre style={{ maxWidth: 520, whiteSpace: 'pre-wrap' }}>{detail.snapshot ? JSON.stringify(detail.snapshot, null, 2) : '-'}</pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default withPagePermission(VipRedeemHistoryAdminPage, {
  permission: 'redeem-history.read'
})
