'use client'

import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { Table, Button, Input, Form, Modal, message, Space, Card, Popconfirm } from 'antd'
import { debounce } from 'lodash'
import { useTranslations , useLocale } from 'next-intl'
import { useState, useEffect } from 'react'
import { withPagePermission } from '@/lib/withPagePermission'

import I18nForm from '@/components/I18nForm'


interface Setting {
  id: number;
  key: string;
  value: Record<string, string>;
  description: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

function SettingsPage() {
  const t = useTranslations('admin')
  const locale = useLocale()
  const [form] = Form.useForm()
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null)
  const [i18nValues, setI18nValues] = useState<Record<string, Record<string, string>>>({})
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async (search?: string) => {
    try {
      setLoading(true)
      const url = search ? `/api/admin/settings?search=${encodeURIComponent(search)}` : '/api/admin/settings'
      const res = await fetch(url)
      const data = await res.json()
      setSettings(data)
    } catch (error) {
      message.error(t('settings.getError'))
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = debounce((value: string) => {
    setSearchText(value)
    fetchSettings(value)
  }, 300)

  const handleSave = async (values: any) => {
    try {
      const method = editingSetting ? 'PATCH' : 'POST'
      const url = editingSetting
        ? `/api/admin/settings/${editingSetting.id}`
        : '/api/admin/settings'

      const formData = {
        key: values.key,
        value: i18nValues.value || {},
        description: i18nValues.description || {},
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        message.success(editingSetting ? t('settings.editSuccess') : t('settings.addSuccess'))
        setModalVisible(false)
        form.resetFields()
        setI18nValues({})
        setLoading(true)
        await fetchSettings()
      } else {
        const error = await res.json()
        message.error(error.message || (editingSetting ? t('settings.editError') : t('settings.addError')))
      }
    } catch (error) {
      message.error(editingSetting ? t('settings.editError') : t('settings.addError'))
    }
  }

  const handleEdit = (record: Setting) => {
    setEditingSetting(record)
    form.setFieldsValue({
      key: record.key,
    })
    setI18nValues({
      value: record.value as Record<string, string>,
      description: record.description as Record<string, string>,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/settings/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        message.success(t('settings.deleteSuccess'))
        fetchSettings()
      } else {
        const error = await res.json()
        message.error(error.message || t('settings.deleteError'))
      }
    } catch (error) {
      message.error(t('settings.deleteError'))
    }
  }

  const columns = [
    {
      title: t('settings.key'),
      dataIndex: 'key',
      key: 'key',
    },
    {
      title: t('settings.value'),
      dataIndex: 'value',
      key: 'value',
      render: (value: Record<string, string>) => (
        <div>
          {Object.entries(value || {}).map(([lang, val]) => (
            <div key={lang}>
              <strong>{lang.toUpperCase()}:</strong> {val}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: t('settings.description'),
      dataIndex: 'description',
      key: 'description',
      render: (description: Record<string, string>) => {
        if (!description) return '-'
        return (
          <div>
            {Object.entries(description).map(([lang, desc]) => (
              <div key={lang}>
                <strong>{lang.toUpperCase()}:</strong> {desc}
              </div>
            ))}
          </div>
        )
      },
    },
    {
      title: t('common.createTime'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: t('common.actions'),
      key: 'action',
      width: 200,
      render: (_: any, record: Setting) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('settings.deleteConfirm')}
            description={t('settings.deleteWarning')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
          <Space>
            <Input
              placeholder={t('settings.searchPlaceholder')}
              prefix={<SearchOutlined />}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
              style={{ width: 200 }}
            />
            <Button
              type="primary"
              onClick={() => {
                setEditingSetting(null)
                form.resetFields()
                setI18nValues({})
                setModalVisible(true)
              }}
            >
              {t('settings.add')}
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={settings}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title={editingSetting ? t('settings.edit') : t('settings.add')}
        open={modalVisible}
        onOk={form.submit}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
          setI18nValues({})
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={editingSetting || {}}
        >
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">{t('common.i18nFields')}</h2>
            <I18nForm
              fields={[
                {
                  name: 'value',
                  label: t('settings.value'),
                  type: 'textarea',
                  required: true,
                  rules: [
                    { required: true, message: t('settings.enterValue') },
                  ],
                },
                {
                  name: 'description',
                  label: t('settings.description'),
                  type: 'textarea',
                },
              ]}
              value={i18nValues}
              onChange={(values) => {
                setI18nValues(values)
              }}
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">{t('common.basicFields')}</h2>
            <Form.Item
              name="key"
              label={t('settings.key')}
              rules={[{ required: true, message: t('settings.enterKey') }]}
            >
              <Input />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default withPagePermission(SettingsPage, {
  permissions: ['system.read'],
  requireAll: false
})
