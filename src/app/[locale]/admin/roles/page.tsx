'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button, Card, Table, Space, Tag, Modal, Form, Input, Select, message, Popconfirm, Upload, Row, Col, Statistic, Tooltip, Dropdown, Badge } from 'antd'
import '@/styles/admin-management.css'
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined, UploadOutlined, SearchOutlined, ReloadOutlined, ExportOutlined, UserOutlined, KeyOutlined, MoreOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { withPagePermission } from '@/lib/withPagePermission'

const { Option } = Select
const { TextArea } = Input
const { Search } = Input

interface Role {
  id: string
  name: string
  displayName: string
  description?: string
  isSystem: boolean
  permissions: string[]
  userCount: number
  created_at: string
}

interface RoleStats {
  totalRoles: number
  systemRoles: number
  customRoles: number
  totalUsers: number
}

function RolesPage() {
  const t = useTranslations('admin.roles')
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [roleModalVisible, setRoleModalVisible] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [roleForm] = Form.useForm()
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [stats, setStats] = useState<RoleStats>({
    totalRoles: 0,
    systemRoles: 0,
    customRoles: 0,
    totalUsers: 0
  })

  // 获取角色列表
  const fetchRoles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/roles')
      const result = await response.json()
      if (result.success) {
        setRoles(result.data)
        setFilteredRoles(result.data)
        
        // 计算统计信息
        const totalRoles = result.data.length
        const systemRoles = result.data.filter((role: Role) => role.isSystem).length
        const customRoles = totalRoles - systemRoles
        const totalUsers = result.data.reduce((sum: number, role: Role) => sum + (Number(role.userCount) || 0), 0)
        
        setStats({
          totalRoles,
          systemRoles,
          customRoles,
          totalUsers
        })
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  // 搜索和筛选
  useEffect(() => {
    let filtered = roles

    // 按搜索文本筛选
    if (searchText) {
      filtered = filtered.filter(role => 
        role.displayName.toLowerCase().includes(searchText.toLowerCase()) ||
        role.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (role.description && role.description.toLowerCase().includes(searchText.toLowerCase()))
      )
    }

    // 按类型筛选
    if (filterType === 'system') {
      filtered = filtered.filter(role => role.isSystem)
    } else if (filterType === 'custom') {
      filtered = filtered.filter(role => !role.isSystem)
    }

    setFilteredRoles(filtered)
  }, [roles, searchText, filterType])

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value)
  }

  // 处理类型筛选
  const handleFilterChange = (value: string) => {
    setFilterType(value)
  }

  // 重置筛选
  const handleResetFilters = () => {
    setSearchText('')
    setFilterType('all')
  }

  // 创建/更新角色
  const handleRoleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const url = editingRole ? `/api/admin/roles/${editingRole.id}` : '/api/admin/roles'
      const method = editingRole ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })

      const result = await response.json()
      if (result.success) {
        message.success(editingRole ? '角色更新成功' : '角色创建成功')
        setRoleModalVisible(false)
        setEditingRole(null)
        roleForm.resetFields()
        fetchRoles()
      } else {
        message.error(result.error || '操作失败')
      }
    } catch (error) {
      message.error('操作失败')
      console.error('Error saving role:', error)
    } finally {
      setLoading(false)
    }
  }

  // 删除角色
  const handleDeleteRole = async (roleId: string) => {
    try {
      const response = await fetch(`/api/admin/roles?roleId=${roleId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        message.success('角色删除成功')
        fetchRoles()
      } else {
        message.error(result.error || '删除失败')
      }
    } catch (error) {
      message.error('删除失败')
      console.error('Error deleting role:', error)
    }
  }

  // 编辑角色
  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    roleForm.setFieldsValue({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      permissions: role.permissions || []
    })
    setRoleModalVisible(true)
  }

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    setLoading(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (!data.roles) {
        message.error('文件格式错误，请确保包含 roles 字段')
        return
      }
      
      let successCount = 0
      let errorCount = 0
      
      for (const role of data.roles) {
        try {
          const response = await fetch('/api/admin/roles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(role)
          })
          const result = await response.json()
          if (result.success) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
        }
      }
      
      message.success(`角色数据导入完成！成功: ${successCount}，失败: ${errorCount}`)
      fetchRoles()
      setUploadModalVisible(false)
      
    } catch (error) {
      message.error('文件解析失败，请确保文件是有效的 JSON 格式')
      console.error('Error parsing file:', error)
    } finally {
      setLoading(false)
    }
    
    return false
  }

  // 下载示例文件
  const handleDownloadExample = () => {
    const link = document.createElement('a')
    link.href = '/permissions-data.json'
    link.download = 'permissions-data.json'
    link.click()
  }

  // 导出角色数据
  const handleExportRoles = () => {
    const csvContent = [
      ['角色名称', '角色标识', '描述', '类型', '权限数量', '用户数量', '创建时间'],
      ...filteredRoles.map(role => [
        role.displayName,
        role.name,
        role.description || '',
        role.isSystem ? '系统角色' : '自定义角色',
        (role.permissions?.length || 0).toString(),
        (Number(role.userCount) || 0).toString(),
        new Date(role.created_at).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `roles_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const columns = [
    {
      title: '角色名称',
      key: 'displayName',
      render: (record: Role) => (
        <div>
          <div className="font-medium">{record.displayName}</div>
          <div className="text-sm text-gray-500">{record.name}</div>
        </div>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-'
    },
    {
      title: '权限数量',
      key: 'permissionCount',
      render: (record: Role) => (
        <Tag color="blue">{record.permissions?.length || 0} 个权限</Tag>
      )
    },
    {
      title: '用户数量',
      key: 'userCount',
      render: (record: Role) => (
        <Tag color="green">{Number(record.userCount) || 0} 个用户</Tag>
      )
    },
    {
      title: '类型',
      key: 'isSystem',
      render: (record: Role) => (
        <Tag color={record.isSystem ? 'red' : 'blue'}>
          {record.isSystem ? '系统角色' : '自定义角色'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (record: Role) => {
        const actionItems: MenuProps['items'] = [
          {
            key: 'permissions',
            label: '权限设置',
            icon: <SettingOutlined />,
            onClick: () => router.push(`/admin/roles/${record.id}/permissions`)
          },
          {
            key: 'edit',
            label: '编辑角色',
            icon: <EditOutlined />,
            disabled: record.isSystem,
            onClick: () => handleEditRole(record)
          },
          {
            type: 'divider'
          },
          {
            key: 'delete',
            label: '删除角色',
            icon: <DeleteOutlined />,
            danger: true,
            disabled: record.isSystem,
            onClick: () => handleDeleteRole(record.id)
          }
        ]

        return (
          <Space>
            <Tooltip title="权限设置">
              <Button 
                type="text" 
                icon={<SettingOutlined />}
                onClick={() => router.push(`/admin/roles/${record.id}/permissions`)}
              />
            </Tooltip>
            <Tooltip title="编辑角色">
              <Button 
                type="text" 
                icon={<EditOutlined />}
                onClick={() => handleEditRole(record)}
                disabled={record.isSystem}
              />
            </Tooltip>
            <Dropdown menu={{ items: actionItems }} trigger={['click']}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        )
      }
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">角色管理</h1>
            <p className="text-gray-600">管理系统角色和权限分配</p>
          </div>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchRoles}
              loading={loading}
            >
              刷新
            </Button>
            <Button 
              icon={<ExportOutlined />} 
              onClick={handleExportRoles}
            >
              导出数据
            </Button>
            <Button 
              icon={<UploadOutlined />}
              onClick={() => setUploadModalVisible(true)}
            >
              导入角色数据
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingRole(null)
                roleForm.resetFields()
                setRoleModalVisible(true)
              }}
            >
              创建角色
            </Button>
          </Space>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card className="admin-stats-card">
            <Statistic
              title="总角色数"
              value={stats.totalRoles}
              prefix={<KeyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="admin-stats-card">
            <Statistic
              title="系统角色"
              value={stats.systemRoles}
              valueStyle={{ color: '#cf1322' }}
              prefix={<KeyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="admin-stats-card">
            <Statistic
              title="自定义角色"
              value={stats.customRoles}
              valueStyle={{ color: '#1890ff' }}
              prefix={<KeyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="admin-stats-card">
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索筛选区域 */}
      <Card className="mb-4 admin-filter-card">
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Search
              placeholder="搜索角色名称、标识或描述"
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择类型"
              allowClear
              style={{ width: '100%' }}
              value={filterType}
              onChange={handleFilterChange}
            >
              <Option value="all">全部</Option>
              <Option value="system">系统角色</Option>
              <Option value="custom">自定义角色</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Button onClick={handleResetFilters}>重置筛选</Button>
          </Col>
          <Col span={8}>
            <div className="text-right text-gray-500">
              显示 {filteredRoles.length} / {roles.length} 个角色
            </div>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          className="admin-table"
          columns={columns}
          dataSource={filteredRoles}
          rowKey="id"
          loading={loading}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            className: 'admin-pagination'
          }}
        />
      </Card>

      {/* 角色编辑模态框 */}
      <Modal
        title={editingRole ? '编辑角色' : '创建角色'}
        open={roleModalVisible}
        onCancel={() => {
          setRoleModalVisible(false)
          setEditingRole(null)
          roleForm.resetFields()
        }}
        onOk={() => roleForm.submit()}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={roleForm}
          layout="vertical"
          onFinish={handleRoleSubmit}
        >
          <Form.Item
            label="角色标识"
            name="name"
            rules={[
              { required: true, message: '请输入角色标识' },
              { pattern: /^[a-z0-9_]+$/, message: '只能包含小写字母、数字和下划线' }
            ]}
          >
            <Input placeholder="例如: admin, moderator" />
          </Form.Item>

          <Form.Item
            label="显示名称"
            name="displayName"
            rules={[{ required: true, message: '请输入显示名称' }]}
          >
            <Input placeholder="例如: 管理员, 版主" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <TextArea rows={3} placeholder="角色描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 文件上传模态框 */}
      <Modal
        title="导入角色数据"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="space-y-4">
          <div className="text-gray-600">
            <p>请选择包含角色数据的 JSON 文件进行导入。</p>
            <p className="text-sm mt-2">文件格式要求：</p>
            <ul className="text-sm mt-1 ml-4 list-disc">
              <li>必须包含 <code>roles</code> 字段</li>
              <li>JSON 格式正确</li>
              <li>文件大小不超过 10MB</li>
            </ul>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload
              accept=".json"
              beforeUpload={handleFileUpload}
              showUploadList={false}
              disabled={loading}
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
              disabled={loading}
            >
              下载示例文件
            </Button>
            <Button 
              onClick={() => setUploadModalVisible(false)}
              disabled={loading}
            >
              取消
            </Button>
          </div>
          
          {loading && (
            <div className="text-center text-blue-600">
              正在导入角色数据，请稍候...
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

// 使用页面级权限校验
export default withPagePermission(RolesPage, {
  permission: 'role.read'
})
