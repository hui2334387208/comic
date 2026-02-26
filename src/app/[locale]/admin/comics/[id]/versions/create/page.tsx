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
  Switch,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
import { withPagePermission } from '@/lib/withPagePermission'

function CreateComicVersionPage() {
  const router = useRouter()
  const params = useParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const comicId = params.id as string

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/comics/${comicId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      const result = await response.json()

      if (result.success) {
        message.success('版本创建成功')
        router.push(`/admin/comics/${comicId}/versions`)
      } else {
        message.error(result.error || '创建版本失败')
      }
    } catch (error) {
      message.error('创建版本失败')
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
          返回版本列表
        </Button>
        <h1 className="text-2xl font-bold">创建新版本</h1>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                version: 1,
                isLatestVersion: true,
              }}
            >
              <Form.Item
                name="version"
                label="版本号"
                rules={[{ required: true, message: '请输入版本号' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="版本号" />
              </Form.Item>

              <Form.Item name="versionDescription" label="版本描述">
                <Input.TextArea
                  rows={4}
                  placeholder="描述此版本的变更内容"
                />
              </Form.Item>

              <Form.Item name="parentVersionId" label="父版本ID">
                <InputNumber min={1} style={{ width: '100%' }} placeholder="基于哪个版本创建（可选）" />
              </Form.Item>

              <Form.Item name="isLatestVersion" valuePropName="checked">
                <Switch /> 设为最新版本
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    创建版本
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
              <p><strong>版本号：</strong>建议使用递增的整数，如 1, 2, 3...</p>
              <p><strong>版本描述：</strong>说明此版本的主要变更或特点。</p>
              <p><strong>父版本：</strong>如果是基于某个版本修改的，可以指定父版本。</p>
              <p><strong>最新版本：</strong>标记为最新版本后，用户默认看到此版本。</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default withPagePermission(CreateComicVersionPage, {
  permission: 'comic-version.create'
})
