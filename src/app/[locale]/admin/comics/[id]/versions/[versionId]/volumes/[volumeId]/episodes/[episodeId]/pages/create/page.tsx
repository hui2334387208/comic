'use client'

import React, { useState } from 'react'
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Space,
  Row,
  Col,
  InputNumber,
  Select,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'
import { withPagePermission } from '@/lib/withPagePermission'

function CreateComicPagePage() {
  const router = useRouter()
  const params = useParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const comicId = params.id as string
  const versionId = params.versionId as string
  const volumeId = params.volumeId as string
  const episodeId = params.episodeId as string

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes/${episodeId}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      const result = await response.json()

      if (result.success) {
        message.success('页创建成功')
        router.push(`/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes/${episodeId}/pages`)
      } else {
        message.error(result.error || '创建页失败')
      }
    } catch (error) {
      message.error('创建页失败')
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
          返回页列表
        </Button>
        <h1 className="text-2xl font-bold">创建新页</h1>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                pageNumber: 1,
                status: 'draft',
                panelCount: 0,
                pageLayout: 'default',
              }}
            >
              <Form.Item
                name="pageNumber"
                label="页码"
                rules={[{ required: true, message: '请输入页码' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="第几页" />
              </Form.Item>

              <Form.Item name="pageLayout" label="页面布局">
                <Select>
                  <Select.Option value="default">默认</Select.Option>
                  <Select.Option value="single">单格</Select.Option>
                  <Select.Option value="double">双格</Select.Option>
                  <Select.Option value="triple">三格</Select.Option>
                  <Select.Option value="quad">四格</Select.Option>
                  <Select.Option value="multi">多格</Select.Option>
                  <Select.Option value="fullpage">全页</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item name="imageUrl" label="页面图片">
                <ImageUpload
                  value={form.getFieldValue('imageUrl')}
                  onChange={(url) => form.setFieldsValue({ imageUrl: url })}
                />
              </Form.Item>

              <Form.Item name="status" label="状态">
                <Select>
                  <Select.Option value="draft">草稿</Select.Option>
                  <Select.Option value="published">已发布</Select.Option>
                  <Select.Option value="archived">已归档</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    创建页
                  </Button>
                  <Button onClick={() => router.back()}>取消</Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="提示">
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>页码：</strong>建议使用递增的整数，如 1, 2, 3...</p>
              <p><strong>页面布局：</strong>这一页的分镜布局类型。</p>
              <p><strong>页面图片：</strong>由多个分镜合成的完整页面图片。</p>
              <p><strong>分镜：</strong>创建页面后，可以添加具体的分镜内容。</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default withPagePermission(CreateComicPagePage, {
  permission: 'comic-page.create'
})
