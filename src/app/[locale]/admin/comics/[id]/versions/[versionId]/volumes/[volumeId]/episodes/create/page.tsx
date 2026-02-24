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

function CreateComicEpisodePage() {
  const router = useRouter()
  const params = useParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const comicId = params.id as string
  const versionId = params.versionId as string
  const volumeId = params.volumeId as string

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      const result = await response.json()

      if (result.success) {
        message.success('话创建成功')
        router.push(`/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes`)
      } else {
        message.error(result.error || '创建话失败')
      }
    } catch (error) {
      message.error('创建话失败')
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
          返回话列表
        </Button>
        <h1 className="text-2xl font-bold">创建新话</h1>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                episodeNumber: 1,
                status: 'draft',
                pageCount: 0,
              }}
            >
              <Form.Item
                name="episodeNumber"
                label="话数"
                rules={[{ required: true, message: '请输入话数' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="第几话" />
              </Form.Item>

              <Form.Item
                name="title"
                label="话标题"
                rules={[{ required: true, message: '请输入话标题' }]}
              >
                <Input placeholder="输入话标题" size="large" />
              </Form.Item>

              <Form.Item name="description" label="话描述">
                <Input.TextArea
                  rows={4}
                  placeholder="描述这一话的主要内容"
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
                    创建话
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
              <p><strong>话数：</strong>建议使用递增的整数，如 1, 2, 3...</p>
              <p><strong>话标题：</strong>这一话的名称。</p>
              <p><strong>话描述：</strong>简要说明这一话的剧情内容。</p>
              <p><strong>状态：</strong>草稿状态不会对外显示。</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default CreateComicEpisodePage
