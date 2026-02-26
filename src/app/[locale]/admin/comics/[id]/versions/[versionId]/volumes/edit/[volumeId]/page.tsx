'use client'

import React, { useState, useEffect } from 'react'
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
  Spin,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'
import { withPagePermission } from '@/lib/withPagePermission'

function EditComicVolumePage() {
  const router = useRouter()
  const params = useParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const comicId = params.id as string
  const versionId = params.versionId as string
  const volumeId = params.volumeId as string

  useEffect(() => {
    if (volumeId) {
      fetchVolume()
    }
  }, [volumeId])

  const fetchVolume = async () => {
    try {
      const response = await fetch(`/api/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}`)
      const result = await response.json()
      if (result.success) {
        form.setFieldsValue(result.data)
      } else {
        message.error('加载卷失败')
        router.back()
      }
    } catch (error) {
      message.error('加载卷失败')
      router.back()
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      const result = await response.json()

      if (result.success) {
        message.success('卷更新成功')
        router.push(`/admin/comics/${comicId}/versions/${versionId}/volumes`)
      } else {
        message.error(result.error || '更新卷失败')
      }
    } catch (error) {
      message.error('更新卷失败')
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
          返回卷列表
        </Button>
        <h1 className="text-2xl font-bold">编辑卷</h1>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                name="volumeNumber"
                label="卷号"
                rules={[{ required: true, message: '请输入卷号' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="第几卷" />
              </Form.Item>

              <Form.Item
                name="title"
                label="卷标题"
                rules={[{ required: true, message: '请输入卷标题' }]}
              >
                <Input placeholder="输入卷标题" size="large" />
              </Form.Item>

              <Form.Item name="description" label="卷描述">
                <Input.TextArea
                  rows={4}
                  placeholder="描述这一卷的主要内容"
                />
              </Form.Item>

              <Form.Item name="coverImage" label="卷封面">
                <ImageUpload
                  value={form.getFieldValue('coverImage')}
                  onChange={(url) => form.setFieldsValue({ coverImage: url })}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="startEpisode" label="起始话数">
                    <InputNumber min={1} style={{ width: '100%' }} placeholder="第几话开始" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="endEpisode" label="结束话数">
                    <InputNumber min={1} style={{ width: '100%' }} placeholder="第几话结束" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="status" label="状态">
                    <Select>
                      <Select.Option value="draft">草稿</Select.Option>
                      <Select.Option value="published">已发布</Select.Option>
                      <Select.Option value="archived">已归档</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    保存更改
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
              <p><strong>卷号：</strong>建议使用递增的整数，如 1, 2, 3...</p>
              <p><strong>卷标题：</strong>这一卷的名称。</p>
              <p><strong>话数范围：</strong>这一卷包含的话数范围，例如第1-10话。</p>
              <p><strong>封面：</strong>这一卷的封面图片。</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default withPagePermission(EditComicVolumePage, {
  permission: 'comic-volume.update'
})
