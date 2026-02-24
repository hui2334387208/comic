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
  Spin,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'

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

function EditComicPage() {
  const router = useRouter()
  const params = useParams()
  const [form] = Form.useForm()

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  const comicId = params.id as string

  useEffect(() => {
    if (comicId) {
      fetchComic()
      fetchCategories()
      fetchTags()
    }
  }, [comicId])

  const fetchComic = async () => {
    try {
      const response = await fetch(`/api/admin/comics/${comicId}`)
      const result = await response.json()
      if (result.success) {
        form.setFieldsValue(result.data)
      } else {
        message.error('加载漫画失败')
        router.push('/admin/comics')
      }
    } catch (error) {
      message.error('加载漫画失败')
      router.push('/admin/comics')
    } finally {
      setFetching(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/comics/categories?status=active&pageSize=100')
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
      const response = await fetch('/api/admin/comics/tags?status=active&pageSize=100')
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
      const response = await fetch(`/api/admin/comics/${comicId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      const result = await response.json()

      if (result.success) {
        message.success('漫画更新成功')
        router.push('/admin/comics')
      } else {
        message.error(result.error || '更新漫画失败')
      }
    } catch (error) {
      message.error('更新漫画失败')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          className="mb-4"
        >
          返回漫画列表
        </Button>
        <h1 className="text-2xl font-bold">编辑漫画</h1>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Row gutter={24}>
          <Col span={16}>
            <Card title="基本信息" className="mb-6">
              <Form.Item
                name="title"
                label="标题"
                rules={[{ required: true, message: '请输入漫画标题' }]}
              >
                <Input placeholder="输入漫画标题" size="large" />
              </Form.Item>

              <Form.Item name="slug" label="别名">
                <Input placeholder="留空则自动生成" />
              </Form.Item>

              <Form.Item name="description" label="描述">
                <Input.TextArea
                  rows={4}
                  placeholder="输入漫画描述"
                />
              </Form.Item>

              <Form.Item name="prompt" label="AI提示词">
                <Input.TextArea
                  rows={3}
                  placeholder="输入生成此漫画的提示词"
                />
              </Form.Item>

              <Form.Item name="coverImage" label="封面图片">
                <ImageUpload
                  value={form.getFieldValue('coverImage')}
                  onChange={(url) => form.setFieldsValue({ coverImage: url })}
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

              <Form.Item name="style" label="风格">
                <Input placeholder="例如: 日漫, 美漫, 水墨" />
              </Form.Item>

              <Divider />

              <Form.Item name="isPublic" valuePropName="checked">
                <Switch /> 公开
              </Form.Item>

              <Form.Item name="isFeatured" valuePropName="checked">
                <Switch /> 推荐
              </Form.Item>

              <Form.Item name="model" label="AI模型">
                <Input placeholder="例如: dall-e-3, midjourney" />
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
                  保存更改
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

export default EditComicPage
