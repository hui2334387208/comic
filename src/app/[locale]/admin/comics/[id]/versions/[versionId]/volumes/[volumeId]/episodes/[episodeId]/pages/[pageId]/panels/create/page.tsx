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
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
import { withPagePermission } from '@/lib/withPagePermission'

function CreateComicPanelPage() {
  const router = useRouter()
  const params = useParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const comicId = params.id as string
  const versionId = params.versionId as string
  const volumeId = params.volumeId as string
  const episodeId = params.episodeId as string
  const pageId = params.pageId as string

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      // 如果characters是字符串，尝试转换为JSON
      if (values.characters && typeof values.characters === 'string') {
        try {
          // 尝试解析为数组
          const charArray = values.characters.split(',').map((c: string) => c.trim()).filter(Boolean)
          values.characters = JSON.stringify(charArray)
        } catch {
          // 保持原样
        }
      }

      const response = await fetch(`/api/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes/${episodeId}/pages/${pageId}/panels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      const result = await response.json()

      if (result.success) {
        message.success('分镜创建成功')
        router.push(`/admin/comics/${comicId}/versions/${versionId}/volumes/${volumeId}/episodes/${episodeId}/pages/${pageId}/panels`)
      } else {
        message.error(result.error || '创建分镜失败')
      }
    } catch (error) {
      message.error('创建分镜失败')
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
          返回分镜列表
        </Button>
        <h1 className="text-2xl font-bold">创建新分镜</h1>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                panelNumber: 1,
              }}
            >
              <Form.Item
                name="panelNumber"
                label="分镜序号"
                rules={[{ required: true, message: '请输入分镜序号' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="第几格" />
              </Form.Item>

              <Form.Item
                name="sceneDescription"
                label="画面描述"
                rules={[{ required: true, message: '请输入画面描述' }]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="描述这一格的画面内容，例如：主角站在悬崖边，背景是夕阳"
                />
              </Form.Item>

              <Form.Item name="dialogue" label="对话">
                <Input.TextArea
                  rows={3}
                  placeholder="角色的对话内容"
                />
              </Form.Item>

              <Form.Item name="narration" label="旁白">
                <Input.TextArea
                  rows={2}
                  placeholder="旁白或画外音"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="emotion" label="情感氛围">
                    <Input placeholder="例如：紧张、欢乐、悲伤" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="cameraAngle" label="镜头角度">
                    <Input placeholder="例如：俯视、仰视、特写" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item 
                name="characters" 
                label="角色"
                help="多个角色用逗号分隔，例如：主角,配角A,配角B"
              >
                <Input placeholder="出现的角色" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    创建分镜
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
              <p><strong>画面描述：</strong>详细描述这一格的视觉内容，包括人物、场景、动作等。</p>
              <p><strong>对话：</strong>角色在这一格说的话。</p>
              <p><strong>旁白：</strong>画外音或叙述文字。</p>
              <p><strong>情感氛围：</strong>这一格想要传达的情绪。</p>
              <p><strong>镜头角度：</strong>拍摄角度，影响画面的视觉效果。</p>
              <p><strong>角色：</strong>出现在这一格中的角色列表。</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default withPagePermission(CreateComicPanelPage, {
  permission: 'comic-panel.create'
})
