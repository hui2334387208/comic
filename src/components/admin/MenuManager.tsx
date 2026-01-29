'use client'

import { useState, useEffect } from 'react'
import { Button, Table, Modal, Form, Input, Select, Switch, message, Tree, Space, Popconfirm, Upload } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, MenuOutlined, UploadOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'

interface MenuItem {
  id: string
  key: string
  label: string
  path: string
  icon?: string
  parentId?: string
  permission?: string
  order: number
  isVisible: boolean
  isSystem: boolean
  meta?: any
  children?: MenuItem[]
}

const MenuManager = () => {
  const t = useTranslations('admin.sidebar')
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [form] = Form.useForm()
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [importLoading, setImportLoading] = useState(false)

  useEffect(() => {
    loadMenus()
  }, [])

  const loadMenus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/menus')
      const result = await response.json()
      if (result.success) {
        setMenus(result.data)
      } else {
        message.error('加载菜单失败')
      }
    } catch (error) {
      message.error('加载菜单失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingMenu(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (menu: MenuItem) => {
    setEditingMenu(menu)
    form.setFieldsValue(menu)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/menus/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (result.success) {
        message.success('删除成功')
        loadMenus()
      } else {
        message.error(result.error || '删除失败')
      }
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const url = editingMenu ? `/api/admin/menus/${editingMenu.id}` : '/api/admin/menus'
      const method = editingMenu ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values)
      })

      const result = await response.json()
      if (result.success) {
        message.success(editingMenu ? '更新成功' : '创建成功')
        setModalVisible(false)
        loadMenus()
      } else {
        message.error(result.error || '操作失败')
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    setImportLoading(true)
    try {
      // 读取文件内容
      const text = await file.text()
      const data = JSON.parse(text)
      
      // 验证文件格式
      if (!data.menus) {
        message.error('文件格式错误，请确保包含 menus 字段')
        return
      }
      
      let successCount = 0
      let errorCount = 0
      
      // 创建菜单
      for (const menu of data.menus) {
        try {
          const menuResponse = await fetch('/api/admin/menus', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(menu)
          })
          
          if (menuResponse.ok) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
        }
      }
      
      message.success(`导入完成！成功：${successCount}，失败：${errorCount}`)
      setUploadModalVisible(false)
      loadMenus()
    } catch (error) {
      console.error('文件解析失败:', error)
      message.error('文件解析失败，请检查文件格式')
    } finally {
      setImportLoading(false)
    }
    
    return false // 阻止默认上传行为
  }

  // 下载示例文件
  const handleDownloadExample = () => {
    const exampleData = {
      menus: [
        {
          key: "dashboard",
          label: "仪表盘",
          path: "/admin/dashboard",
          icon: "dashboard",
          permission: "menu.dashboard",
          order: 1,
          isVisible: true
        },
        {
          key: "content",
          label: "内容管理",
          path: "/admin/content",
          icon: "content",
          permission: "menu.content",
          order: 2,
          isVisible: true
        }
      ]
    }
    
    const blob = new Blob([JSON.stringify(exampleData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'menus-data.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    {
      title: '菜单名称',
      dataIndex: 'label',
      key: 'label',
      render: (label: string, record: MenuItem) => {
        // 尝试使用国际化翻译，如果翻译不存在则使用原始标签
        try {
          return t(record.key as any) || label
        } catch {
          return label
        }
      },
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
    },
    {
      title: '权限',
      dataIndex: 'permission',
      key: 'permission',
    },
    {
      title: '排序',
      dataIndex: 'order',
      key: 'order',
      width: 80,
    },
    {
      title: '可见',
      dataIndex: 'isVisible',
      key: 'isVisible',
      width: 80,
      render: (visible: boolean) => (visible ? '是' : '否'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: MenuItem) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {!record.isSystem && (
            <Popconfirm
              title="确定删除这个菜单吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: '8px' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          添加菜单
        </Button>
        <Button
          type="default"
          icon={<UploadOutlined />}
          onClick={() => setUploadModalVisible(true)}
        >
          导入菜单数据
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={menus}
        loading={loading}
        rowKey="id"
        pagination={false}
        expandable={{
          childrenColumnName: 'children',
          defaultExpandAllRows: true,
        }}
      />

      <Modal
        title={editingMenu ? '编辑菜单' : '添加菜单'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="key"
            label="菜单标识"
            rules={[{ required: true, message: '请输入菜单标识' }]}
          >
            <Input placeholder="如: dashboard" />
          </Form.Item>

          <Form.Item
            name="label"
            label="菜单名称"
            rules={[{ required: true, message: '请输入菜单名称' }]}
          >
            <Input placeholder="如: 仪表盘" />
          </Form.Item>

          <Form.Item
            name="path"
            label="路径"
            rules={[{ required: true, message: '请输入路径' }]}
          >
            <Input placeholder="如: /admin/dashboard" />
          </Form.Item>

          <Form.Item
            name="icon"
            label="图标"
          >
            <Input placeholder="如: dashboard" />
          </Form.Item>

          <Form.Item
            name="permission"
            label="权限"
          >
            <Input placeholder="如: dashboard.read" />
          </Form.Item>

          <Form.Item
            name="order"
            label="排序"
            initialValue={0}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="isVisible"
            label="是否可见"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* 文件上传模态框 */}
      <Modal
        title="导入菜单数据"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="space-y-4">
          <div className="text-gray-600">
            <p>请选择包含菜单数据的 JSON 文件进行导入。</p>
            <p className="text-sm mt-2">文件格式要求：</p>
            <ul className="text-sm mt-1 ml-4 list-disc">
              <li>必须包含 <code>menus</code> 字段</li>
              <li>JSON 格式正确</li>
              <li>文件大小不超过 10MB</li>
            </ul>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload
              accept=".json"
              beforeUpload={handleFileUpload}
              showUploadList={false}
              disabled={importLoading}
            >
              <div className="space-y-2">
                <UploadOutlined className="text-4xl text-gray-400" />
                <div>
                  <p className="text-lg font-medium">点击或拖拽文件到此区域上传</p>
                  <p className="text-sm text-gray-500">支持 JSON 格式文件</p>
                </div>
              </div>
            </Upload>
          </div>
          
          <div className="flex justify-between items-center">
            <Button 
              onClick={handleDownloadExample}
              disabled={importLoading}
            >
              下载示例文件
            </Button>
            <Button 
              onClick={() => setUploadModalVisible(false)}
              disabled={importLoading}
            >
              取消
            </Button>
          </div>
          
          {importLoading && (
            <div className="text-center text-blue-600">
              正在导入菜单数据，请稍候...
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default MenuManager
