'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Button, Card, Tabs, Table, Space, Tag, Modal, Form, Input, Select, message, Popconfirm, Tooltip, Upload, Row, Col, Statistic, Badge, Dropdown, Divider } from 'antd'
import '@/styles/admin-management.css'
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, KeyOutlined, UploadOutlined, SearchOutlined, ReloadOutlined, ExportOutlined, FilterOutlined, MoreOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { withPagePermission } from '@/lib/withPagePermission'

const { TabPane } = Tabs
const { Option } = Select
const { TextArea } = Input
const { Search } = Input


interface Permission {
  id: string
  name: string
  displayName: string
  description?: string
  module: string
  action: string
  resource?: string
  isSystem: boolean
  created_at: string
}

interface PermissionRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  roleName: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy?: string
  reviewedAt?: string
  reviewComment?: string
  created_at: string
}

interface PermissionStats {
  totalPermissions: number
  systemPermissions: number
  customPermissions: number
  totalRequests: number
  pendingRequests: number
}

function PermissionsPage() {
  const t = useTranslations('admin.permissions')
  const router = useRouter()
  const params = useParams()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [filteredPermissions, setFilteredPermissions] = useState<Permission[]>([])
  const [requests, setRequests] = useState<PermissionRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<PermissionRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [permissionModalVisible, setPermissionModalVisible] = useState(false)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [permissionForm] = Form.useForm()
  const [initLoading, setInitLoading] = useState(false)
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filterModule, setFilterModule] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [stats, setStats] = useState<PermissionStats>({
    totalPermissions: 0,
    systemPermissions: 0,
    customPermissions: 0,
    totalRequests: 0,
    pendingRequests: 0
  })


  // 获取权限列表
  const fetchPermissions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/permissions/permissions')
      const result = await response.json()
      if (result.success) {
        setPermissions(result.data)
        setFilteredPermissions(result.data)
        
        // 计算统计信息
        const totalPermissions = result.data.length
        const systemPermissions = result.data.filter((permission: Permission) => permission.isSystem).length
        const customPermissions = totalPermissions - systemPermissions
        
        setStats(prev => ({
          ...prev,
          totalPermissions,
          systemPermissions,
          customPermissions
        }))
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取权限请求
  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/admin/permissions/requests')
      const result = await response.json()
      if (result.success) {
        setRequests(result.data)
        setFilteredRequests(result.data)
        
        // 计算请求统计
        const totalRequests = result.data.length
        const pendingRequests = result.data.filter((request: PermissionRequest) => request.status === 'pending').length
        
        setStats(prev => ({
          ...prev,
          totalRequests,
          pendingRequests
        }))
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }

  useEffect(() => {
    fetchPermissions()
    fetchRequests()
  }, [])

  // 搜索和筛选权限
  useEffect(() => {
    let filtered = permissions

    // 按搜索文本筛选
    if (searchText) {
      filtered = filtered.filter(permission => 
        permission.displayName.toLowerCase().includes(searchText.toLowerCase()) ||
        permission.name.toLowerCase().includes(searchText.toLowerCase()) ||
        permission.module.toLowerCase().includes(searchText.toLowerCase()) ||
        permission.action.toLowerCase().includes(searchText.toLowerCase()) ||
        (permission.description && permission.description.toLowerCase().includes(searchText.toLowerCase()))
      )
    }

    // 按模块筛选
    if (filterModule !== 'all') {
      filtered = filtered.filter(permission => permission.module === filterModule)
    }

    // 按类型筛选
    if (filterType === 'system') {
      filtered = filtered.filter(permission => permission.isSystem)
    } else if (filterType === 'custom') {
      filtered = filtered.filter(permission => !permission.isSystem)
    }

    setFilteredPermissions(filtered)
  }, [permissions, searchText, filterModule, filterType])

  // 搜索和筛选请求
  useEffect(() => {
    let filtered = requests

    // 按状态筛选
    if (filterStatus !== 'all') {
      filtered = filtered.filter(request => request.status === filterStatus)
    }

    setFilteredRequests(filtered)
  }, [requests, filterStatus])

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value)
  }

  // 处理筛选
  const handleFilterChange = (key: string, value: string) => {
    switch (key) {
      case 'module':
        setFilterModule(value)
        break
      case 'type':
        setFilterType(value)
        break
      case 'status':
        setFilterStatus(value)
        break
    }
  }

  // 重置筛选
  const handleResetFilters = () => {
    setSearchText('')
    setFilterModule('all')
    setFilterType('all')
    setFilterStatus('all')
  }


  // 创建/更新权限
  const handlePermissionSubmit = async (values: any) => {
    setLoading(true)
    try {
      const url = editingPermission ? `/api/admin/permissions/permissions/${editingPermission.id}` : '/api/admin/permissions/permissions'
      const method = editingPermission ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })

      const result = await response.json()
      if (result.success) {
        message.success(editingPermission ? '权限更新成功' : '权限创建成功')
        setPermissionModalVisible(false)
        setEditingPermission(null)
        permissionForm.resetFields()
        fetchPermissions()
      } else {
        message.error(result.error || '操作失败')
      }
    } catch (error) {
      message.error('操作失败')
      console.error('Error saving permission:', error)
    } finally {
      setLoading(false)
    }
  }


  // 删除权限
  const handleDeletePermission = async (permissionId: string) => {
    try {
      const response = await fetch(`/api/admin/permissions/permissions/${permissionId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        message.success('权限删除成功')
        fetchPermissions()
      } else {
        message.error(result.error || '删除失败')
      }
    } catch (error) {
      message.error('删除失败')
      console.error('Error deleting permission:', error)
    }
  }

  // 审核权限请求
  const handleReviewRequest = async (requestId: string, status: 'approved' | 'rejected', comment?: string) => {
    try {
      const response = await fetch(`/api/admin/permissions/requests/${requestId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comment })
      })

      const result = await response.json()
      if (result.success) {
        message.success(status === 'approved' ? '请求已批准' : '请求已拒绝')
        fetchRequests()
      } else {
        message.error(result.error || '操作失败')
      }
    } catch (error) {
      message.error('操作失败')
      console.error('Error reviewing request:', error)
    }
  }

  // 初始化权限数据
  const handleInitPermissions = async () => {
    setInitLoading(true)
    try {
      const response = await fetch('/api/admin/init-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const result = await response.json()
      
      if (result.success) {
        message.success('权限数据初始化成功！')
        fetchPermissions()
      } else {
        message.error(result.message || '权限数据初始化失败')
      }
    } catch (error) {
      message.error('权限数据初始化失败')
      console.error('Error initializing permissions:', error)
    } finally {
      setInitLoading(false)
    }
  }

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    setInitLoading(true)
    try {
      // 读取文件内容
      const text = await file.text()
      const data = JSON.parse(text)
      
      // 验证文件格式
      if (!data.permissions) {
        message.error('文件格式错误，请确保包含 permissions 字段')
        return
      }
      
      let successCount = 0
      let errorCount = 0
      
      // 创建权限
      for (const permission of data.permissions) {
        try {
          const permissionResponse = await fetch('/api/admin/permissions/permissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(permission)
          })
          const result = await permissionResponse.json()
          if (result.success) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
        }
      }
      
      message.success(`权限数据导入完成！成功: ${successCount}，失败: ${errorCount}`)
      
      // 刷新数据
      fetchPermissions()
      
      // 关闭上传模态框
      setUploadModalVisible(false)
      
    } catch (error) {
      message.error('文件解析失败，请确保文件是有效的 JSON 格式')
      console.error('Error parsing file:', error)
    } finally {
      setInitLoading(false)
    }
    
    return false // 阻止默认上传行为
  }

  // 下载示例文件
  const handleDownloadExample = () => {
    const link = document.createElement('a')
    link.href = '/permissions-data.json'
    link.download = 'permissions-data.json'
    link.click()
  }

  // 导出权限数据
  const handleExportPermissions = () => {
    const csvContent = [
      ['权限名称', '权限标识', '模块', '动作', '资源', '类型', '描述', '创建时间'],
      ...filteredPermissions.map(permission => [
        permission.displayName,
        permission.name,
        permission.module,
        permission.action,
        permission.resource || '',
        permission.isSystem ? '系统权限' : '自定义权限',
        permission.description || '',
        new Date(permission.created_at).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `permissions_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // 导出请求数据
  const handleExportRequests = () => {
    const csvContent = [
      ['用户', '邮箱', '申请角色', '申请原因', '状态', '审核人', '审核时间', '审核备注', '申请时间'],
      ...filteredRequests.map(request => [
        request.userName,
        request.userEmail,
        request.roleName,
        request.reason,
        request.status === 'pending' ? '待审核' : request.status === 'approved' ? '已批准' : '已拒绝',
        request.reviewedBy || '',
        request.reviewedAt ? new Date(request.reviewedAt).toLocaleString() : '',
        request.reviewComment || '',
        new Date(request.created_at).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `permission_requests_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }


  // 编辑权限
  const handleEditPermission = (permission: Permission) => {
    setEditingPermission(permission)
    permissionForm.setFieldsValue({
      name: permission.name,
      displayName: permission.displayName,
      description: permission.description,
      module: permission.module,
      action: permission.action,
      resource: permission.resource
    })
    setPermissionModalVisible(true)
  }


  const permissionColumns = [
    {
      title: '权限名称',
      key: 'displayName',
      render: (record: Permission) => (
        <div>
          <div className="font-medium">{record.displayName}</div>
          <div className="text-sm text-gray-500">{record.name}</div>
        </div>
      )
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '动作',
      dataIndex: 'action',
      key: 'action',
      render: (text: string) => <Tag color="green">{text}</Tag>
    },
    {
      title: '资源',
      dataIndex: 'resource',
      key: 'resource',
      render: (text: string) => text || '-'
    },
    {
      title: '类型',
      key: 'isSystem',
      render: (record: Permission) => (
        <Tag color={record.isSystem ? 'red' : 'blue'}>
          {record.isSystem ? '系统权限' : '自定义权限'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (record: Permission) => {
        const actionItems: MenuProps['items'] = [
          {
            key: 'edit',
            label: '编辑权限',
            icon: <EditOutlined />,
            disabled: record.isSystem,
            onClick: () => handleEditPermission(record)
          },
          {
            type: 'divider'
          },
          {
            key: 'delete',
            label: '删除权限',
            icon: <DeleteOutlined />,
            danger: true,
            disabled: record.isSystem,
            onClick: () => handleDeletePermission(record.id)
          }
        ]

        return (
          <Space>
            <Tooltip title="编辑权限">
              <Button 
                type="text" 
                icon={<EditOutlined />}
                onClick={() => handleEditPermission(record)}
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

  const requestColumns = [
    {
      title: '用户',
      key: 'user',
      render: (record: PermissionRequest) => (
        <div>
          <div className="font-medium">{record.userName}</div>
          <div className="text-sm text-gray-500">{record.userEmail}</div>
        </div>
      )
    },
    {
      title: '申请角色',
      dataIndex: 'roleName',
      key: 'roleName',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '申请原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          pending: { color: 'orange', text: '待审核' },
          approved: { color: 'green', text: '已批准' },
          rejected: { color: 'red', text: '已拒绝' }
        }
        const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: PermissionRequest) => (
        record.status === 'pending' ? (
          <Space>
            <Button 
              type="text" 
              size="small"
              onClick={() => handleReviewRequest(record.id, 'approved')}
            >
              批准
            </Button>
            <Button 
              type="text" 
              danger 
              size="small"
              onClick={() => handleReviewRequest(record.id, 'rejected')}
            >
              拒绝
            </Button>
          </Space>
        ) : '-'
      )
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">权限管理</h1>
            <p className="text-gray-600">管理系统角色和权限</p>
          </div>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => {
                fetchPermissions()
                fetchRequests()
              }}
              loading={loading}
            >
              刷新
            </Button>
            <Button 
              icon={<UploadOutlined />}
              onClick={() => setUploadModalVisible(true)}
            >
              导入权限数据
            </Button>
          </Space>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card className="admin-stats-card">
            <Statistic
              title="总权限数"
              value={stats.totalPermissions}
              prefix={<KeyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="admin-stats-card">
            <Statistic
              title="系统权限"
              value={stats.systemPermissions}
              valueStyle={{ color: '#cf1322' }}
              prefix={<KeyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="admin-stats-card">
            <Statistic
              title="自定义权限"
              value={stats.customPermissions}
              valueStyle={{ color: '#1890ff' }}
              prefix={<KeyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="admin-stats-card">
            <Statistic
              title="待审核请求"
              value={stats.pendingRequests}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="permissions">
        <TabPane 
          tab={
            <span>
              权限管理
              <Badge count={filteredPermissions.length} style={{ marginLeft: 8 }} />
            </span>
          } 
          key="permissions"
        >
          {/* 权限搜索筛选区域 */}
          <Card className="mb-4 admin-filter-card">
            <Row gutter={16} align="middle">
              <Col span={6}>
                <Search
                  placeholder="搜索权限名称、标识、模块或动作"
                  allowClear
                  onSearch={handleSearch}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={4}>
                <Select
                  placeholder="选择模块"
                  allowClear
                  style={{ width: '100%' }}
                  value={filterModule}
                  onChange={(value) => handleFilterChange('module', value)}
                >
                  {Array.from(new Set(permissions.map(p => p.module))).map(module => (
                    <Option key={module} value={module}>{module}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Select
                  placeholder="选择类型"
                  allowClear
                  style={{ width: '100%' }}
                  value={filterType}
                  onChange={(value) => handleFilterChange('type', value)}
                >
                  <Option value="all">全部</Option>
                  <Option value="system">系统权限</Option>
                  <Option value="custom">自定义权限</Option>
                </Select>
              </Col>
              <Col span={4}>
                <Button onClick={handleResetFilters}>重置筛选</Button>
              </Col>
              <Col span={6}>
                <div className="admin-button-group">
                  <Button 
                    icon={<ExportOutlined />} 
                    onClick={handleExportPermissions}
                  >
                    导出权限
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingPermission(null)
                      permissionForm.resetFields()
                      setPermissionModalVisible(true)
                    }}
                  >
                    创建权限
                  </Button>
                </div>
              </Col>
            </Row>
          </Card>

          <Card>
            <Table
              className="admin-table"
              columns={permissionColumns}
              dataSource={filteredPermissions}
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
        </TabPane>

        <TabPane 
          tab={
            <span>
              权限请求
              <Badge count={stats.pendingRequests} style={{ marginLeft: 8 }} />
            </span>
          } 
          key="requests"
        >
          {/* 请求搜索筛选区域 */}
          <Card className="mb-4 admin-filter-card">
            <Row gutter={16} align="middle">
              <Col span={6}>
                <Select
                  placeholder="选择状态"
                  allowClear
                  style={{ width: '100%' }}
                  value={filterStatus}
                  onChange={(value) => handleFilterChange('status', value)}
                >
                  <Option value="all">全部</Option>
                  <Option value="pending">待审核</Option>
                  <Option value="approved">已批准</Option>
                  <Option value="rejected">已拒绝</Option>
                </Select>
              </Col>
              <Col span={4}>
                <Button onClick={() => setFilterStatus('all')}>重置筛选</Button>
              </Col>
              <Col span={14}>
                <div className="admin-button-group">
                  <Button 
                    icon={<ExportOutlined />} 
                    onClick={handleExportRequests}
                  >
                    导出请求
                  </Button>
                </div>
              </Col>
            </Row>
          </Card>

          <Card>
            <Table
              className="admin-table"
              columns={requestColumns}
              dataSource={filteredRequests}
              rowKey="id"
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                className: 'admin-pagination'
              }}
            />
          </Card>
        </TabPane>
      </Tabs>


      {/* 权限编辑模态框 */}
      <Modal
        title={editingPermission ? '编辑权限' : '创建权限'}
        open={permissionModalVisible}
        onCancel={() => {
          setPermissionModalVisible(false)
          setEditingPermission(null)
          permissionForm.resetFields()
        }}
        onOk={() => permissionForm.submit()}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={permissionForm}
          layout="vertical"
          onFinish={handlePermissionSubmit}
        >
          <Form.Item
            label="权限标识"
            name="name"
            rules={[
              { required: true, message: '请输入权限标识' },
              { pattern: /^[a-z0-9_]+$/, message: '只能包含小写字母、数字和下划线' }
            ]}
          >
            <Input placeholder="例如: user.create, admin.delete" />
          </Form.Item>

          <Form.Item
            label="显示名称"
            name="displayName"
            rules={[{ required: true, message: '请输入显示名称' }]}
          >
            <Input placeholder="例如: 创建用户, 删除管理员" />
          </Form.Item>

          <Form.Item
            label="模块"
            name="module"
            rules={[{ required: true, message: '请输入模块' }]}
          >
            <Input placeholder="例如: user, admin, content" />
          </Form.Item>

          <Form.Item
            label="动作"
            name="action"
            rules={[{ required: true, message: '请输入动作' }]}
          >
            <Select placeholder="选择动作">
              <Option value="create">创建</Option>
              <Option value="read">查看</Option>
              <Option value="update">更新</Option>
              <Option value="delete">删除</Option>
              <Option value="manage">管理</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="资源"
            name="resource"
          >
            <Input placeholder="例如: user, post, comment" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <TextArea rows={3} placeholder="权限描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 文件上传模态框 */}
      <Modal
        title="导入权限数据"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="space-y-4">
          <div className="text-gray-600">
            <p>请选择包含权限数据的 JSON 文件进行导入。</p>
            <p className="text-sm mt-2">文件格式要求：</p>
            <ul className="text-sm mt-1 ml-4 list-disc">
              <li>必须包含 <code>permissions</code> 字段</li>
              <li>JSON 格式正确</li>
              <li>文件大小不超过 10MB</li>
            </ul>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload
              accept=".json"
              beforeUpload={handleFileUpload}
              showUploadList={false}
              disabled={initLoading}
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
              disabled={initLoading}
            >
              下载示例文件
            </Button>
            <Button 
              onClick={() => setUploadModalVisible(false)}
              disabled={initLoading}
            >
              取消
            </Button>
          </div>
          
          {initLoading && (
            <div className="text-center text-blue-600">
              正在导入权限数据，请稍候...
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

// 使用页面级权限校验
export default withPagePermission(PermissionsPage, {
  permission: 'permission.read'
})
