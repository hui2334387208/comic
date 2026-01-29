'use client'

import { Table, Tag } from 'antd'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useState } from 'react'

const levelColors = {
  info: 'blue',
  warning: 'orange',
  error: 'red',
}

// 定义SystemLog接口，由于没有访问到原始的schema定义
interface SystemLog {
  id: string;
  level: string;
  module: string;
  action: string;
  description: string;
  ip: string;
  userAgent: string;
  language: string;
  createdAt: string;
}

export function SystemLogsTable() {
  const t = useTranslations('admin')
  const searchParams = useSearchParams()
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  })

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', pagination.current.toString())
      params.set('pageSize', pagination.pageSize.toString())

      const response = await fetch(`/api/admin/system/logs?${params.toString()}`)
      if (!response.ok) throw new Error(t('common.error'))
      const data = await response.json()
      setLogs(data.items)
      setTotal(data.total)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }, [searchParams, pagination, t])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const columns: TableProps<SystemLog>['columns'] = [
    {
      title: t('systemLogs.time'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: t('systemLogs.level'),
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => (
        <Tag color={levelColors[level as keyof typeof levelColors]}>
          {level === 'info' ? t('systemLogs.info') : level === 'warning' ? t('systemLogs.warning') : t('systemLogs.error')}
        </Tag>
      ),
    },
    {
      title: t('systemLogs.module'),
      dataIndex: 'module',
      key: 'module',
      width: 120,
    },
    {
      title: t('systemLogs.action'),
      dataIndex: 'action',
      key: 'action',
      width: 150,
    },
    {
      title: t('systemLogs.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('common.language'),
      dataIndex: 'language',
      key: 'language',
      width: 100,
      render: (language: string) => (
        <Tag color="blue">
          {language === 'en' ? 'English' : '中文'}
        </Tag>
      ),
    },
    {
      title: t('systemLogs.ip'),
      dataIndex: 'ip',
      key: 'ip',
      width: 140,
    },
    {
      title: t('systemLogs.userAgent'),
      dataIndex: 'userAgent',
      key: 'userAgent',
      width: 200,
      ellipsis: true,
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={logs}
      rowKey="id"
      loading={loading}
      pagination={{
        ...pagination,
        total,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `${t('common.total')}: ${total}`,
        onChange: (page, pageSize) => {
          setPagination({ current: page, pageSize })
        },
      }}
      scroll={{ x: 'max-content' }}
    />
  )
}
