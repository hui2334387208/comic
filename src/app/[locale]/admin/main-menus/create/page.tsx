'use client'

import { message, Button, Form, Input, InputNumber, Select, Card, Space, Switch } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useCallback, useMemo } from 'react'

import I18nForm from '@/components/I18nForm'
import { withPagePermission } from '@/lib/withPagePermission'

const { Option } = Select

interface MenuOption {
  id: number;
  name?: string;
  path: string;
  parentId?: number | null;
}

const statusOptions = [
  { label: '启用', value: 'active' },
  { label: '禁用', value: 'inactive' },
]

const fetchMenus = async (): Promise<MenuOption[]> => {
  try {
    const res = await fetch('/api/admin/main-menus')
    if (!res.ok) throw new Error()
    return await res.json()
  } catch {
    return []
  }
}

const submitMenu = async (payload: any) => {
  const response = await fetch('/api/admin/main-menus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || '创建失败')
  }
}

interface MenuFormValues {
  path: string;
  icon: string;
  parentId: number | null;
  order: number;
  status: string;
  isTop: boolean;
  translations: Record<string, Record<string, string>>;
}

const CreateMainMenuPage: React.FC = () => {
  const router = useRouter()
  const [form] = Form.useForm<MenuFormValues & { translations: Record<string, Record<string, string>> }>()
  const [submitting, setSubmitting] = useState(false)
  const [menus, setMenus] = useState<MenuOption[]>([])
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({})

  useEffect(() => {
    fetchMenus().then(setMenus)
  }, [])

  // 统一表单提交
  const handleFinish = useCallback(
    async (values: any) => {
      setSubmitting(true)
      try {
        // 将多语言数据转换为数组格式
        const translationsArr = Object.entries(translations).reduce((acc, [field, values]) => {
          Object.entries(values).forEach(([lang, value]) => {
            const existingTrans = acc.find(t => t.lang === lang)
            if (existingTrans) {
              existingTrans[field] = value || ''
            } else {
              acc.push({
                lang,
                [field]: value || '',
              })
            }
          })
          return acc
        }, [] as any[])
        await submitMenu(
          { ...values, translations: translationsArr },
        )
        message.success('菜单创建成功')
        router.push('/admin/main-menus')
      } catch (err: any) {
        message.error(err.message)
      } finally {
        setSubmitting(false)
      }
    },
    [router, translations],
  )

  const parentMenuOptions = useMemo(
    () => [
      ...menus.filter(menu => !menu.parentId).map(menu => (
        <Option key={menu.id} value={menu.id}>{menu.name || menu.path}</Option>
      )),
    ],
    [menus],
  )

  return (
    <div style={{ padding: '32px 24px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
        <Link href="/admin/main-menus" style={{ display: 'flex', alignItems: 'center', color: '#666', textDecoration: 'none', marginRight: 16 }}>
          <span style={{ fontSize: 18, marginRight: 8 }}>←</span>
          返回菜单列表
        </Link>
      </div>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '24px 32px', borderRadius: 12, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>新建主菜单</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>请完善菜单的基本信息和多语言内容，支持路径、图标、父级、排序及状态设置。</p>
      </div>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ width: '100%' }}
      >
        <Card title={<span style={{ fontWeight: 600 }}>多语言信息</span>} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', width: '100%', marginBottom: 24 }}>
          <I18nForm
            fields={[
              { name: 'name', label: '菜单名称', required: true, placeholder: '请输入菜单名称' },
              { name: 'metaTitle', label: 'SEO标题', placeholder: '请输入SEO标题' },
              { name: 'metaDescription', label: 'SEO描述', type: 'textarea', placeholder: '请输入SEO描述' },
              { name: 'metaKeywords', label: 'SEO关键词', placeholder: '请输入SEO关键词' },
            ]}
            value={translations}
            onChange={setTranslations}
          />
        </Card>
        <Card title={<span style={{ fontWeight: 600 }}>基本信息</span>} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', width: '100%' }}>
          <Form.Item name="path" label="路径" rules={[{ required: true, message: '请输入菜单路径' }]}>
            <Input
              placeholder="如：/content"
            />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Input placeholder="如：HomeOutlined" />
          </Form.Item>
          <Form.Item name="parentId" label="父级菜单">
            <Select allowClear placeholder="请选择父级菜单">{parentMenuOptions}</Select>
          </Form.Item>
          <Form.Item name="order" label="排序" initialValue={0} >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="数字越小越靠前" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="isTop" label="顶部菜单" valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
        </Card>
        <Form.Item style={{ marginTop: 24, textAlign: 'left' }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>新建</Button>
            <Button onClick={() => router.push('/admin/main-menus')}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}

export default withPagePermission(CreateMainMenuPage, {
  permission: 'main-menu.create'
})
