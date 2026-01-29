'use client'

import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { Card, Button, Table, message, Space, Input, Select, Empty, Row, Col, Typography, Spin } from 'antd'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { withPagePermission } from '@/lib/withPagePermission'

const { Title } = Typography

type ChangeFreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

interface SitemapItem {
  id: number;
  loc: string;
  lastmod: string;
  changefreq: ChangeFreq;
  priority: number;
  hreflang?: string;
}

function SitemapManagement() {
  const t = useTranslations('admin')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SitemapItem[]>([])
  const [searchText, setSearchText] = useState('')

  // 获取数据
  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/system/sitemap')
      const result = await response.json()
      if (response.ok) {
        setData(result.urls)
      } else {
        message.error(result.message || t('common.error'))
      }
    } catch (error) {
      message.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 过滤数据
  const filteredData = data.filter(item => 
    item.loc.toLowerCase().includes(searchText.toLowerCase())
  )

  // 删除
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/system/sitemap/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        message.success(t('common.deleteSuccess'))
        fetchData()
      } else {
        message.error(t('common.error'))
      }
    } catch (error) {
      message.error(t('common.error'))
    }
  }

  const columns = [
    {
      title: t('sitemap.url'),
      dataIndex: 'loc',
      key: 'loc',
      width: 200,
    },
    {
      title: t('sitemap.changeFreq'),
      dataIndex: 'changefreq',
      key: 'changefreq',
      width: 120,
    },
    {
      title: t('sitemap.priority'),
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
    },
    {
      title: t('sitemap.language'),
      dataIndex: 'hreflang',
      key: 'hreflang',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: t('sitemap.lastModified'),
      dataIndex: 'lastmod',
      key: 'lastmod',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 150,
      render: (_: any, record: SitemapItem) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => router.push(`/admin/system/sitemap/${record.id}/edit`)}>
            {t('sitemap.edit')}
          </Button>
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>
            {t('sitemap.delete')}
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 渐变背景标题区域 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '24px 32px',
        borderRadius: 12,
        marginBottom: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}>
        <Title level={2} style={{ color: 'white', margin: 0 }}>{t('sitemap.title')}</Title>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>{t('sitemap.description')}</p>
      </div>

      {/* 主要内容卡片 */}
      <Card
        bordered={false}
        style={{
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        {/* 操作栏 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }} align="middle">
          <Col flex="auto">
            <Input
              placeholder={t('common.search')}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push('/admin/system/sitemap/create')}
              size="large"
            >
              {t('sitemap.createSitemap')}
            </Button>
          </Col>
        </Row>

        {/* 数据表格 */}
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="loc"
            scroll={{ x: 900 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => t('common.total', { total }),
            }}
            locale={{
              emptyText: <Empty description={t('sitemap.noSitemap')} />,
            }}
          />
        </Spin>
      </Card>
    </div>
  )
}

export default withPagePermission(SitemapManagement, {
  permission: 'sitemap.read'
})
