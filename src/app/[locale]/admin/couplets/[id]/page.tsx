'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Space,
  Tag,
  Descriptions,
  message,
  Spin,
  Row,
  Col,
  Statistic,
  Typography,
  Divider,
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  HeartOutlined,
} from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'

const { Title, Paragraph, Text } = Typography

interface Couplet {
  id: number
  title: string
  slug: string
  description: string
  status: string
  isPublic: boolean
  isFeatured: boolean
  viewCount: number
  likeCount: number
  hot: number
  model: string
  prompt: string
  language: string
  createdAt: string
  updatedAt: string
  author?: {
    id: string
    name: string
    email: string
  }
  category?: {
    id: number
    name: string
    slug: string
  }
}

interface CoupletContent {
  upperLine: string
  lowerLine: string
  horizontalScroll: string
  appreciation: string
}

function CoupletDetailPage() {
  const t = useTranslations('admin.couplets')
  const router = useRouter()
  const params = useParams()

  const [loading, setLoading] = useState(true)
  const [couplet, setCouplet] = useState<Couplet | null>(null)
  const [contents, setContents] = useState<CoupletContent[]>([])

  const coupletId = params.id as string

  useEffect(() => {
    if (coupletId) {
      fetchCouplet()
      fetchContents()
    }
  }, [coupletId])

  const fetchCouplet = async () => {
    try {
      const response = await fetch(`/api/admin/couplets/${coupletId}`)
      const result = await response.json()
      if (result.success) {
        setCouplet(result.data)
      } else {
        message.error('加载对联失败')
        router.push('/admin/couplets')
      }
    } catch (error) {
      message.error('加载对联失败')
      router.push('/admin/couplets')
    } finally {
      setLoading(false)
    }
  }

  const fetchContents = async () => {
    try {
      const response = await fetch(`/api/admin/couplets/${coupletId}/contents`)
      const result = await response.json()
      if (result.success) {
        setContents(result.data.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch contents:', error)
    }
  }

  const handleEdit = () => {
    router.push(`/admin/couplets/edit/${coupletId}`)
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/couplets/${coupletId}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        message.success('对联删除成功')
        router.push('/admin/couplets')
      } else {
        message.error(result.error || '删除对联失败')
      }
    } catch (error) {
      message.error('删除对联失败')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  if (!couplet) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2>对联未找到</h2>
          <Button onClick={() => router.push('/admin/couplets')}>
            返回对联列表
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'green'
      case 'draft': return 'orange'
      case 'archived': return 'red'
      default: return 'default'
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          className="mb-4"
        >
          返回对联列表
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <Title level={2} className="mb-2">{couplet.title}</Title>
            <Space>
              <Tag color={getStatusColor(couplet.status)}>
                {couplet.status === 'published' ? '已发布' : couplet.status === 'draft' ? '草稿' : '已归档'}
              </Tag>
              {couplet.isPublic && <Tag color="blue">公开</Tag>}
              {couplet.isFeatured && <Tag color="gold">推荐</Tag>}
              <Tag>{couplet.language === 'zh' ? '中文' : 'ENGLISH'}</Tag>
            </Space>
          </div>
          
          <Space>
            <Button icon={<EditOutlined />} onClick={handleEdit}>
              编辑
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={handleDelete}
            >
              删除
            </Button>
          </Space>
        </div>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          {/* Couplet Content */}
          <Card title="对联内容" className="mb-6">
            {contents.length > 0 ? (
              contents.map((content, index) => (
                <div key={index} className="mb-6 last:mb-0">
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-lg border-l-4 border-red-500">
                    <div className="text-center space-y-4">
                      <div className="text-xl font-bold text-red-800">
                        {content.upperLine}
                      </div>
                      <div className="text-xl font-bold text-red-800">
                        {content.lowerLine}
                      </div>
                      {content.horizontalScroll && (
                        <div className="text-lg font-semibold text-orange-700 border-t pt-2">
                          横批：{content.horizontalScroll}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {content.appreciation && (
                    <div className="mt-4">
                      <Title level={5}>赏析</Title>
                      <Paragraph>{content.appreciation}</Paragraph>
                    </div>
                  )}
                  
                  {index < contents.length - 1 && <Divider />}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                暂无内容
              </div>
            )}
          </Card>

          {/* Description */}
          {couplet.description && (
            <Card title="描述" className="mb-6">
              <Paragraph>{couplet.description}</Paragraph>
            </Card>
          )}

          {/* AI Prompt */}
          {couplet.prompt && (
            <Card title="AI提示词" className="mb-6">
              <Paragraph>
                <Text code>{couplet.prompt}</Text>
              </Paragraph>
            </Card>
          )}
        </Col>

        <Col span={8}>
          {/* Statistics */}
          <Card title="统计信息" className="mb-6">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="浏览量"
                  value={couplet.viewCount}
                  prefix={<EyeOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="点赞数"
                  value={couplet.likeCount}
                  prefix={<HeartOutlined />}
                />
              </Col>
            </Row>
            <Row gutter={16} className="mt-4">
              <Col span={24}>
                <Statistic
                  title="热度分数"
                  value={couplet.hot}
                />
              </Col>
            </Row>
          </Card>

          {/* Details */}
          <Card title="详细信息">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="ID">
                {couplet.id}
              </Descriptions.Item>
              
              <Descriptions.Item label="别名">
                <Text code>{couplet.slug}</Text>
              </Descriptions.Item>
              
              {couplet.category && (
                <Descriptions.Item label="分类">
                  <Tag>{couplet.category.name}</Tag>
                </Descriptions.Item>
              )}
              
              {couplet.author && (
                <Descriptions.Item label="作者">
                  {couplet.author.name}
                </Descriptions.Item>
              )}
              
              {couplet.model && (
                <Descriptions.Item label="AI模型">
                  <Tag color="purple">{couplet.model}</Tag>
                </Descriptions.Item>
              )}
              
              <Descriptions.Item label="语言">
                {couplet.language === 'zh' ? '中文' : 'English'}
              </Descriptions.Item>
              
              <Descriptions.Item label="创建时间">
                {new Date(couplet.createdAt).toLocaleString()}
              </Descriptions.Item>
              
              <Descriptions.Item label="更新时间">
                {new Date(couplet.updatedAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default CoupletDetailPage