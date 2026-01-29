'use client'

import { Card } from 'antd'
import { useTranslations } from 'next-intl'
import React from 'react'
import { withPagePermission } from '@/lib/withPagePermission'

import { SystemLogsFilters } from './components/system-logs-filters'
import { SystemLogsTable } from './components/system-logs-table'


function SystemLogsPage() {
  const t = useTranslations('admin')

  return (
    <div className="p-6">
      <Card title={t('systemLogs.title')}>
        <SystemLogsFilters />
        <SystemLogsTable />
      </Card>
    </div>
  )
}

export default withPagePermission(SystemLogsPage, {
  permissions: ['system.read'],
  requireAll: false
})
