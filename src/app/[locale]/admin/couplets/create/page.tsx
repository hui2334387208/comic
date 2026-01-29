'use client'

import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  message,
  Space,
  Switch,
  Row,
  Col,
  Divider,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface Category {
  id: number
  name: string
  slug: string
}

interface Tag {
  id: number
  name: string
  slug: string
  color: string
}

function CreateCoupletPage() {
  const t = useTranslations('admin.couplets')
  const router = useRouter()
  const [form] = Form.useForm()

  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    fetchCategories()
    fetchTags()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/couplet-categories?status=active&pageSize=100')
      const result = await response.json()
      if (result.success) {
        setCategories(result.data.items)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/admin/couplet-tags?status=active&pageSize=100')
      const result = await response.json()
      if (result.success) {
        setTags(result.data.items)
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      // Separate couplet data from content data
      const { upperLine, lowerLine, horizontalScroll, appreciation, tagIds, ...coupletData } = values
      
      // Create the couplet first
      const response = await fetch('/api/admin/couplets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coupletData),
      })
      const result = await response.json()

      if (result.success) {
        const coupletId = result.data.id
        
        // If there's content data, create the content
        if (upperLine || lowerLine || horizontalScroll || appreciation) {
          const contentResponse = await fetch(`/api/admin/couplets/${coupletId}/contents`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              upperLine,
              lowerLine,
              horizontalScroll,
              appreciation,
              orderIndex: 0,
            }),
          })
          
          if (!contentResponse.ok) {
            console.warn('Failed to create couplet content, but couplet was created')
          }
        }
        
        // Handle tags if provided
        if (tagIds && tagIds.length > 0) {
          // TODO: Implement tag relations API
          console.log('Tags to be associated:', tagIds)
        }
        
        message.success('对联创建成功')
        router.push('/admin/couplets')
      } else {
        message.error(result.error || '创建对联失败')
      }
    } catch (error) {
      message.error('创建对联失败')
    } finally {
      setLoading(false)
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
        <h1 className="text-2xl font-bold">创建新对联</h1>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'draft',
          isPublic: true,
          isFeatured: false,
          language: 'zh',
        }}
      >
        <Row gutter={24}>
          <Col span={16}>
            <Card title="基本信息" className="mb-6">
              <Form.Item
                name="title"
                label="标题"
                rules={[{ required: true, message: '请输入对联标题' }]}
              >
                <Input placeholder="输入对联标题" size="large" />
              </Form.Item>

              <Form.Item name="slug" label="别名">
                <Input placeholder="留空则自动生成" />
              </Form.Item>

              <Form.Item name="description" label="描述">
                <Input.TextArea
                  rows={4}
                  placeholder="输入对联描述"
                />
              </Form.Item>

              <Form.Item name="prompt" label="AI提示词">
                <Input.TextArea
                  rows={3}
                  placeholder="输入生成此对联的提示词"
                />
              </Form.Item>
            </Card>

            <Card title="对联内容" className="mb-6">
              <Form.Item name="upperLine" label="上联">
                <Input placeholder="输入上联" size="large" />
              </Form.Item>

              <Form.Item name="lowerLine" label="下联">
                <Input placeholder="输入下联" size="large" />
              </Form.Item>

              <Form.Item name="horizontalScroll" label="横批">
                <Input placeholder="输入横批" />
              </Form.Item>

              <Form.Item name="appreciation" label="赏析">
                <Input.TextArea
                  rows={6}
                  placeholder="输入对联的赏析和分析"
                />
              </Form.Item>
            </Card>
          </Col>

          <Col span={8}>
            <Card title="设置" className="mb-6">
              <Form.Item name="categoryId" label="分类">
                <Select
                  placeholder="选择分类"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {categories.map(category => (
                    <Select.Option key={category.id} value={category.id}>
                      {category.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="tagIds" label="标签">
                <Select
                  mode="multiple"
                  placeholder="选择标签"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {tags.map(tag => (
                    <Select.Option key={tag.id} value={tag.id}>
                      <span style={{ color: tag.color }}>{tag.name}</span>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="status" label="状态">
                <Select>
                  <Select.Option value="draft">草稿</Select.Option>
                  <Select.Option value="published">已发布</Select.Option>
                  <Select.Option value="archived">已归档</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item name="language" label="语言">
                <Select>
                  <Select.Option value="zh">中文</Select.Option>
                  <Select.Option value="en">English</Select.Option>
                </Select>
              </Form.Item>

              <Divider />

              <Form.Item name="isPublic" valuePropName="checked">
                <Switch /> 公开
              </Form.Item>

              <Form.Item name="isFeatured" valuePropName="checked">
                <Switch /> 推荐
              </Form.Item>

              <Form.Item name="model" label="AI模型">
                <Input placeholder="例如: gpt-4, claude-3" />
              </Form.Item>
            </Card>

            <Card>
              <Space className="w-full" direction="vertical">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                  size="large"
                  block
                >
                  创建对联
                </Button>
                <Button
                  onClick={() => router.back()}
                  size="large"
                  block
                >
                  取消
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  )
}

export default CreateCoupletPage