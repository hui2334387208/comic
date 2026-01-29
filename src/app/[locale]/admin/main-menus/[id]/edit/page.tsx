'use client'

import { message, Button, Form, Input, InputNumber, Select, Card, Space, Alert, Skeleton, Switch } from 'antd'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import React, { useState, useEffect } from 'react'

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

interface MenuFormValues {
  path: string;
  icon: string;
  parentId: number | null;
  order: number;
  status: string;
  isTop: boolean;
  translations: Record<string, Record<string, string>>;
}

const EditMainMenuPage = () => {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  const [form] = Form.useForm<MenuFormValues>()
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [menus, setMenus] = useState<MenuOption[]>([])
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({})

  useEffect(() => {
    fetch('/api/admin/main-menus')
      .then(res => res.json())
      .then((data: MenuOption[]) => setMenus(data))
      .catch(() => setMenus([]))
  }, [])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/admin/main-menus/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('获取菜单失败')
        return res.json()
      })
      .then((data: any) => {
        // 转换translations为I18nForm需要的结构
        function convertTranslationsForForm(translationsArr: any[]) {
          const result: Record<string, Record<string, string>> = {};
          (translationsArr || []).forEach(item => {
            Object.keys(item).forEach(key => {
              if (key === 'lang') return
              if (!result[key]) result[key] = {}
              result[key][item.lang] = item[key]
            })
          })
          return result
        }
        const formTranslations = convertTranslationsForForm(data.translations)
        form.setFieldsValue({
          ...data,
          translations: formTranslations,
        })
        setTranslations(formTranslations)
        setLoading(false)
      })
      .catch((err: any) => {
        setError(err.message)
        setLoading(false)
      })
  }, [id, form])

  const handleFinish = async (values: MenuFormValues) => {
    setSubmitting(true)
    try {
      // 将多语言数据转换为数组格式
      const translationsArr = Object.entries(translations || {}).reduce((acc, [field, valuesObj]) => {
        Object.entries(valuesObj || {}).forEach(([lang, value]) => {
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
      const response = await fetch(`/api/admin/main-menus/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, translations: translationsArr }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '更新失败')
      }
      message.success('菜单更新成功')
      router.push('/admin/main-menus')
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const parentMenuOptions = [
    ...menus.filter(menu => !menu.parentId && String(menu.id) !== String(id)).map(menu => (
      <Option key={menu.id} value={menu.id}>{menu.name || menu.path}</Option>
    )),
  ]

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />
  if (error) return <Alert message="错误" description={error} type="error" showIcon />

  return (
    <div style={{ padding: '32px 24px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
        <Link href="/admin/main-menus" style={{ display: 'flex', alignItems: 'center', color: '#666', textDecoration: 'none', marginRight: 16 }}>
          <span style={{ fontSize: 18, marginRight: 8 }}>←</span>
          返回菜单列表
        </Link>
      </div>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '24px 32px', borderRadius: 12, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>编辑菜单</h1>
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
            onChange={setTranslations} />
        </Card>
        <Card title={<span style={{ fontWeight: 600 }}>基本信息</span>} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', width: '100%' }}>
          <Form.Item name="path" label="路径" rules={[{ required: true, message: '请输入菜单路径' }]}>
            <Input placeholder="如：/content" />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Input placeholder="如：HomeOutlined" />
          </Form.Item>
          <Form.Item name="parentId" label="父级菜单">
            <Select allowClear placeholder="请选择父级菜单">{parentMenuOptions}</Select>
          </Form.Item>
          <Form.Item name="order" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="数字越小越靠前" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="isTop" label="顶部菜单" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Card>
        <Form.Item style={{ marginTop: 24, textAlign: 'left' }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>保存</Button>
            <Button onClick={() => router.push('/admin/main-menus')}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}

export default withPagePermission(EditMainMenuPage, {
  permission: 'main-menu.update'
})
