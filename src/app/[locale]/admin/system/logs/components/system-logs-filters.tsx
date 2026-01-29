'use client'

import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { DatePicker, Select, Input, Button, Space } from 'antd'
import dayjs from 'dayjs'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback } from 'react'

const { RangePicker } = DatePicker
const { Option } = Select

export function SystemLogsFilters() {
  const t = useTranslations('admin')
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const currentLocale = params.locale || 'en'

  const logLevels = [
    { value: 'info', label: t('systemLogs.info') },
    { value: 'warning', label: t('systemLogs.warning') },
    { value: 'error', label: t('systemLogs.error') },
  ]

  const modules = [
    { value: 'auth', label: t('systemLogs.auth') },
    { value: 'user', label: t('systemLogs.user') },
    { value: 'system', label: t('systemLogs.system') },
    // { value: 'admin', label: t('systemLogs.admin') },
    { value: 'products', label: t('systemLogs.products') },
    { value: 'content', label: t('systemLogs.content') },
    { value: 'cases', label: t('systemLogs.cases') },
  ]

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'zh', label: '中文' },
  ]

  const createQueryString = useCallback(
    (name: string, value: any) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === undefined) {
        params.delete(name)
      } else {
        params.set(name, value)
      }
      return params.toString()
    },
    [searchParams],
  )

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const search = formData.get('search') as string
    router.push(`?${createQueryString('search', search)}`)
  }

  const handleReset = () => {
    router.push('/admin/system/logs')
  }

  return (
    <div className="mb-4">
      <form onSubmit={handleSearch}>
        <Space className="mb-4" size="middle">
          <Input
            name="search"
            placeholder={t('systemLogs.search')}
            defaultValue={searchParams.get('search') || ''}
            style={{ width: 300 }}
          />
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
            {t('systemLogs.searchButton')}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            {t('systemLogs.reset')}
          </Button>
        </Space>
      </form>

      <Space size="middle">
        <RangePicker
          value={[
            searchParams.get('startDate') ? dayjs(searchParams.get('startDate')) : null,
            searchParams.get('endDate') ? dayjs(searchParams.get('endDate')) : null,
          ]}
          onChange={(dates) => {
            const params = new URLSearchParams(searchParams.toString())
            if (dates?.[0]) {
              params.set('startDate', dates[0].format('YYYY-MM-DD'))
            } else {
              params.delete('startDate')
            }
            if (dates?.[1]) {
              params.set('endDate', dates[1].format('YYYY-MM-DD'))
            } else {
              params.delete('endDate')
            }
            router.push(`?${params.toString()}`)
          }}
        />

        <Select
          placeholder={t('systemLogs.level')}
          value={searchParams.get('level') || undefined}
          onChange={(value) => router.push(`?${createQueryString('level', value)}`)}
          style={{ width: 120 }}
          allowClear
        >
          {logLevels.map((level) => (
            <Option key={level.value} value={level.value}>
              {level.label}
            </Option>
          ))}
        </Select>

        <Select
          placeholder={t('systemLogs.module')}
          value={searchParams.get('module') || undefined}
          onChange={(value) => router.push(`?${createQueryString('module', value)}`)}
          style={{ width: 120 }}
          allowClear
        >
          {modules.map((module) => (
            <Option key={module.value} value={module.value}>
              {module.label}
            </Option>
          ))}
        </Select>

        <Select
          placeholder={t('common.language')}
          value={currentLocale}
          onChange={(value) => router.push(`?${createQueryString('language', value)}`)}
          style={{ width: 120 }}
          allowClear
        >
          {languages.map((lang) => (
            <Option key={lang.value} value={lang.value}>
              {lang.label}
            </Option>
          ))}
        </Select>
      </Space>
    </div>
  )
}
