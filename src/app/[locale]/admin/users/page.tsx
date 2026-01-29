'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button, Input, Table, Tag, Space, Modal, message, Select, DatePicker, Card, Row, Col, Statistic, Dropdown, Tooltip, Badge, Popconfirm, Form, Tabs } from 'antd'
import { SearchOutlined, UserOutlined, LockOutlined, UnlockOutlined, EditOutlined, DeleteOutlined, EyeOutlined, MoreOutlined, PlusOutlined, ExportOutlined, ImportOutlined, ReloadOutlined, KeyOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import '@/styles/admin-management.css'
import type { MenuProps } from 'antd'
import { withPagePermission } from '@/lib/withPagePermission'

const { Search } = Input
const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs

interface User {
  id: string
  name: string
  email: string
  username: string
  avatar?: string
  isLocked: boolean
  lockReason?: string
  lockedAt?: string
  created_at: string
  lastSuccessfulLoginAt?: string
  recentSuccessfulLogins: number
  roles: Array<{
    id: string
    name: string
  }>
}

interface UserStats {
  totalUsers: number
  activeUsers: number
  lockedUsers: number
  newUsersToday: number
}

interface SelectedUser {
  id: string
  name: string
  email: string
}

function UsersPage() {
  const t = useTranslations('admin.users')
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    lockedUsers: 0,
    newUsersToday: 0
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([])
  const [createUserModalVisible, setCreateUserModalVisible] = useState(false)
  const [createUserForm] = Form.useForm()
  const [userPermissionsModalVisible, setUserPermissionsModalVisible] = useState(false)
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<User | null>(null)
  const [userPermissions, setUserPermissions] = useState<any[]>([])
  const [availablePermissions, setAvailablePermissions] = useState<any[]>([])

  // 获取用户列表
  const fetchUsers = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.role && { role: filters.role }),
        ...(filters.status && { status: filters.status }),
        ...(filters.dateRange && {
          startDate: filters.dateRange[0].format('YYYY-MM-DD'),
          endDate: filters.dateRange[1].format('YYYY-MM-DD')
        })
      })

      const response = await fetch(`/api/admin/users?${params}`)
      const result = await response.json()

      if (result.success) {
        setUsers(result.data.users)
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize,
          total: result.data.total
        }))
        setStats(result.data.stats)
      } else {
        message.error(result.error || '获取用户列表失败')
      }
    } catch (error) {
      message.error('获取用户列表失败')
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/users/stats')
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [])

  // 搜索处理
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
    fetchUsers(1, pagination.pageSize)
  }

  // 筛选处理
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    fetchUsers(1, pagination.pageSize)
  }

  // 重置筛选
  const handleResetFilters = () => {
    setFilters({
      search: '',
      role: '',
      status: '',
      dateRange: null
    })
    fetchUsers(1, pagination.pageSize)
  }

  // 锁定/解锁用户
  const handleToggleLock = async (user: User) => {
    const action = user.isLocked ? 'unlock' : 'lock'
    const actionText = user.isLocked ? '解锁' : '锁定'
    
    Modal.confirm({
      title: `${actionText}用户`,
      content: `确定要${actionText}用户 ${user.name || user.email} 吗？`,
      onOk: async () => {
        try {
          const response = await fetch(`/api/admin/users/${user.id}/${action}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              reason: user.isLocked ? '' : '管理员操作'
            })
          })

          const result = await response.json()
          if (result.success) {
            message.success(`${actionText}成功`)
            fetchUsers(pagination.current, pagination.pageSize)
          } else {
            message.error(result.error || `${actionText}失败`)
          }
        } catch (error) {
          message.error(`${actionText}失败`)
          console.error(`Error ${action}ing user:`, error)
        }
      }
    })
  }

  // 删除用户
  const handleDeleteUser = async (user: User) => {
    Modal.confirm({
      title: '删除用户',
      content: `确定要删除用户 ${user.name || user.email} 吗？此操作不可恢复！`,
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await fetch(`/api/admin/users/${user.id}`, {
            method: 'DELETE'
          })

          const result = await response.json()
          if (result.success) {
            message.success('删除成功')
            fetchUsers(pagination.current, pagination.pageSize)
          } else {
            message.error(result.error || '删除失败')
          }
        } catch (error) {
          message.error('删除失败')
          console.error('Error deleting user:', error)
        }
      }
    })
  }

  // 查看用户详情
  const handleViewUser = (user: User) => {
    router.push(`/admin/users/${user.id}`)
  }

  // 编辑用户
  const handleEditUser = (user: User) => {
    router.push(`/admin/users/${user.id}/edit`)
  }

  // 创建用户
  const handleCreateUser = async (values: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      })

      const result = await response.json()
      if (result.success) {
        message.success('用户创建成功')
        setCreateUserModalVisible(false)
        createUserForm.resetFields()
        fetchUsers(pagination.current, pagination.pageSize)
      } else {
        message.error(result.error || '创建用户失败')
      }
    } catch (error) {
      message.error('创建用户失败')
      console.error('Error creating user:', error)
    } finally {
      setLoading(false)
    }
  }

  // 批量操作
  const handleBatchOperation = async (action: string) => {
    if (selectedUsers.length === 0) {
      message.warning('请先选择用户')
      return
    }

    const actionText = {
      lock: '锁定',
      unlock: '解锁',
      delete: '删除'
    }[action] || '操作'

    Modal.confirm({
      title: `批量${actionText}用户`,
      content: `确定要${actionText}选中的 ${selectedUsers.length} 个用户吗？`,
      onOk: async () => {
        setLoading(true)
        try {
          let successCount = 0
          let errorCount = 0

          for (const user of selectedUsers) {
            try {
              let response
              if (action === 'delete') {
                response = await fetch(`/api/admin/users/${user.id}`, {
                  method: 'DELETE'
                })
              } else {
                response = await fetch(`/api/admin/users/${user.id}/${action}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    reason: action === 'lock' ? '批量操作' : ''
                  })
                })
              }

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

          message.success(`批量操作完成！成功: ${successCount}，失败: ${errorCount}`)
          setSelectedRowKeys([])
          setSelectedUsers([])
          fetchUsers(pagination.current, pagination.pageSize)
        } catch (error) {
          message.error('批量操作失败')
          console.error('Error in batch operation:', error)
        } finally {
          setLoading(false)
        }
      }
    })
  }

  // 导出用户数据
  const handleExportUsers = () => {
    const csvContent = [
      ['姓名', '邮箱', '用户名', '角色', '状态', '注册时间', '最后登录'],
      ...users.map(user => [
        user.name || '',
        user.email,
        user.username,
        user.roles.map(r => r.name).join(', '),
        user.isLocked ? '已锁定' : '正常',
        dayjs(user.created_at).format('YYYY-MM-DD HH:mm'),
        user.lastSuccessfulLoginAt ? dayjs(user.lastSuccessfulLoginAt).format('YYYY-MM-DD HH:mm') : '从未登录'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `users_${dayjs().format('YYYY-MM-DD')}.csv`
    link.click()
  }

  // 打开用户权限管理
  const handleManageUserPermissions = async (user: User) => {
    setSelectedUserForPermissions(user)
    setUserPermissionsModalVisible(true)
    
    try {
      // 获取用户直接权限
      const response = await fetch(`/api/admin/user-permissions?userId=${user.id}`)
      const result = await response.json()
      
      if (result.success) {
        setUserPermissions(result.data)
      }
      
      // 获取所有可用权限
      const permissionsResponse = await fetch('/api/admin/permissions/permissions')
      const permissionsResult = await permissionsResponse.json()
      
      if (permissionsResult.success) {
        setAvailablePermissions(permissionsResult.data)
      }
    } catch (error) {
      message.error('获取权限信息失败')
      console.error('Error fetching permissions:', error)
    }
  }

  // 分配用户权限
  const handleGrantUserPermission = async (permissionId: string, type: 'direct' | 'restricted' = 'direct') => {
    if (!selectedUserForPermissions) return

    try {
      const response = await fetch('/api/admin/user-permissions/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserForPermissions.id,
          permissionId,
          type,
          reason: '管理员分配'
        })
      })

      const result = await response.json()
      if (result.success) {
        message.success('权限分配成功')
        // 刷新权限列表
        handleManageUserPermissions(selectedUserForPermissions)
      } else {
        message.error(result.error || '权限分配失败')
      }
    } catch (error) {
      message.error('权限分配失败')
      console.error('Error granting permission:', error)
    }
  }

  // 撤销用户权限
  const handleRevokeUserPermission = async (permissionId: string) => {
    if (!selectedUserForPermissions) return

    try {
      const response = await fetch('/api/admin/user-permissions/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserForPermissions.id,
          permissionId
        })
      })

      const result = await response.json()
      if (result.success) {
        message.success('权限撤销成功')
        // 刷新权限列表
        handleManageUserPermissions(selectedUserForPermissions)
      } else {
        message.error(result.error || '权限撤销失败')
      }
    } catch (error) {
      message.error('权限撤销失败')
      console.error('Error revoking permission:', error)
    }
  }

  // 表格行选择
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[], selectedRows: User[]) => {
      setSelectedRowKeys(selectedRowKeys)
      setSelectedUsers(selectedRows.map(user => ({
        id: user.id,
        name: user.name || user.email,
        email: user.email
      })))
    },
    getCheckboxProps: (record: User) => ({
      disabled: record.roles.some(r => r.id === 'admin') // 禁用管理员的选择
    })
  }

  // 批量操作菜单
  const batchMenuItems: MenuProps['items'] = [
    {
      key: 'lock',
      label: '批量锁定',
      icon: <LockOutlined />,
      onClick: () => handleBatchOperation('lock')
    },
    {
      key: 'unlock',
      label: '批量解锁',
      icon: <UnlockOutlined />,
      onClick: () => handleBatchOperation('unlock')
    },
    {
      key: 'delete',
      label: '批量删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleBatchOperation('delete')
    }
  ]

  const columns = [
    {
      title: '用户信息',
      key: 'userInfo',
      render: (record: User) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            {record.avatar ? (
              <img src={record.avatar} alt="avatar" className="w-10 h-10 rounded-full" />
            ) : (
              <UserOutlined className="text-gray-500" />
            )}
          </div>
          <div>
            <div className="font-medium">{record.name || '未设置'}</div>
            <div className="text-sm text-gray-500">{record.email}</div>
            <div className="text-xs text-gray-400">@{record.username}</div>
          </div>
        </div>
      )
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: Array<{id: string, name: string}>) => {
        if (!roles || roles.length === 0) {
          return <Tag color="default">无角色</Tag>
        }
        return (
          <Space wrap>
            {roles.map(role => (
              <Tag key={role.id} color="blue">{role.name}</Tag>
            ))}
          </Space>
        )
      }
    },
    {
      title: '状态',
      key: 'status',
      render: (record: User) => (
        <div className="space-y-1">
          <Tag color={record.isLocked ? 'red' : 'green'}>
            {record.isLocked ? '已锁定' : '正常'}
          </Tag>
          {record.isLocked && record.lockReason && (
            <div className="text-xs text-gray-500">{record.lockReason}</div>
          )}
        </div>
      )
    },
    {
      title: '登录统计',
      key: 'loginStats',
      render: (record: User) => (
        <div className="text-sm">
          <div>最近登录: {record.recentSuccessfulLogins} 次</div>
          <div className="text-gray-500">
            {record.lastSuccessfulLoginAt 
              ? dayjs(record.lastSuccessfulLoginAt).format('YYYY-MM-DD HH:mm')
              : '从未登录'
            }
          </div>
        </div>
      )
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (record: User) => {
        return (
          <Space>
            <Tooltip title="编辑用户">
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={() => handleEditUser(record)}
              />
            </Tooltip>
            <Tooltip title={record.isLocked ? '解锁用户' : '锁定用户'}>
              <Button 
                type="text" 
                icon={record.isLocked ? <UnlockOutlined /> : <LockOutlined />}
                onClick={() => handleToggleLock(record)}
              />
            </Tooltip>
            <Tooltip title="权限管理">
              <Button 
                type="text" 
                icon={<KeyOutlined />}
                onClick={() => handleManageUserPermissions(record)}
              />
            </Tooltip>
            <Tooltip title="删除用户">
              <Popconfirm
                title="确定要删除这个用户吗？"
                onConfirm={() => handleDeleteUser(record)}
                okText="确定"
                cancelText="取消"
                disabled={record.roles.some(r => r.id === 'admin')}
              >
                <Button 
                  type="text" 
                  icon={<DeleteOutlined />}
                  danger
                  disabled={record.roles.some(r => r.id === 'admin')}
                />
              </Popconfirm>
            </Tooltip>
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
            <h1 className="text-2xl font-bold mb-2">用户管理</h1>
            <p className="text-gray-600">管理系统用户和权限</p>
          </div>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => fetchUsers(pagination.current, pagination.pageSize)}
              loading={loading}
            >
              刷新
            </Button>
            <Button 
              icon={<ExportOutlined />} 
              onClick={handleExportUsers}
            >
              导出数据
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setCreateUserModalVisible(true)}
            >
              创建用户
            </Button>
          </Space>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card className="admin-stats-card">
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="admin-stats-card">
            <Statistic
              title="活跃用户"
              value={stats.activeUsers}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="admin-stats-card">
            <Statistic
              title="锁定用户"
              value={stats.lockedUsers}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="admin-stats-card">
            <Statistic
              title="今日新增"
              value={stats.newUsersToday}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选区域 */}
      <Card className="mb-4 admin-filter-card">
        <Row gutter={16} align="middle">
          <Col span={5}>
            <Search
              placeholder="搜索用户名、邮箱"
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择角色"
              allowClear
              style={{ width: '100%' }}
              value={filters.role}
              onChange={(value) => handleFilterChange('role', value)}
            >
              <Option value="admin">管理员</Option>
              <Option value="user">用户</Option>
              <Option value="moderator">版主</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择状态"
              allowClear
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
            >
              <Option value="active">正常</Option>
              <Option value="locked">锁定</Option>
            </Select>
          </Col>
          <Col span={5}>
            <RangePicker
              style={{ width: '100%' }}
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
            />
          </Col>
          <Col span={3}>
            <Button onClick={handleResetFilters}>重置筛选</Button>
          </Col>
          <Col span={3}>
            {selectedUsers.length > 0 && (
              <div className="admin-batch-actions">
                <Dropdown menu={{ items: batchMenuItems }} trigger={['click']}>
                  <Button type="primary" size="small">
                    批量操作 ({selectedUsers.length})
                  </Button>
                </Dropdown>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* 用户表格 */}
      <Card>
        <Table
          className="admin-table"
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => fetchUsers(page, pageSize || 10),
            className: 'admin-pagination'
          }}
        />
      </Card>

      {/* 创建用户模态框 */}
      <Modal
        title="创建用户"
        open={createUserModalVisible}
        onCancel={() => {
          setCreateUserModalVisible(false)
          createUserForm.resetFields()
        }}
        onOk={() => createUserForm.submit()}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={createUserForm}
          layout="vertical"
          onFinish={handleCreateUser}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="用户名"
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
                { max: 20, message: '用户名最多20个字符' }
              ]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>

            <Form.Item
              label="邮箱"
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="姓名"
              name="name"
              rules={[
                { max: 50, message: '姓名最多50个字符' }
              ]}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>

            <Form.Item
              label="角色"
              name="role"
              rules={[
                { required: true, message: '请选择角色' }
              ]}
            >
              <Select placeholder="请选择角色">
                <Option value="user">用户</Option>
                <Option value="moderator">版主</Option>
                <Option value="admin">管理员</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 用户权限管理模态框 */}
      <Modal
        title={`用户权限管理 - ${selectedUserForPermissions?.name || selectedUserForPermissions?.email}`}
        open={userPermissionsModalVisible}
        onCancel={() => {
          setUserPermissionsModalVisible(false)
          setSelectedUserForPermissions(null)
          setUserPermissions([])
        }}
        footer={null}
        width={800}
      >
        <div className="space-y-4">
          <Tabs defaultActiveKey="current">
            <TabPane tab="当前权限" key="current">
              <Table
                dataSource={userPermissions}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: '权限名称',
                    key: 'permissionName',
                    render: (record) => (
                      <div>
                        <div className="font-medium">{record.permissionName}</div>
                        <div className="text-sm text-gray-500">{record.permissionId}</div>
                      </div>
                    )
                  },
                  {
                    title: '类型',
                    key: 'type',
                    render: (record) => (
                      <Tag color={record.type === 'direct' ? 'blue' : 'red'}>
                        {record.type === 'direct' ? '直接权限' : '限制权限'}
                      </Tag>
                    )
                  },
                  {
                    title: '分配时间',
                    key: 'grantedAt',
                    render: (record) => dayjs(record.grantedAt).format('YYYY-MM-DD HH:mm')
                  },
                  {
                    title: '操作',
                    key: 'actions',
                    render: (record) => (
                      <Button 
                        type="text" 
                        danger
                        onClick={() => handleRevokeUserPermission(record.permissionId)}
                      >
                        撤销
                      </Button>
                    )
                  }
                ]}
              />
            </TabPane>
            
            <TabPane tab="分配权限" key="grant">
              <Table
                dataSource={availablePermissions}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                columns={[
                  {
                    title: '权限名称',
                    key: 'displayName',
                    render: (record) => (
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
                    render: (text) => <Tag color="blue">{text}</Tag>
                  },
                  {
                    title: '动作',
                    dataIndex: 'action',
                    key: 'action',
                    render: (text) => <Tag color="green">{text}</Tag>
                  },
                  {
                    title: '操作',
                    key: 'actions',
                    render: (record) => {
                      const hasDirect = userPermissions.some(p => p.permissionId === record.id && p.type === 'direct')
                      const hasRestricted = userPermissions.some(p => p.permissionId === record.id && p.type === 'restricted')
                      
                      return (
                        <Space>
                          <Button 
                            type="text" 
                            size="small"
                            disabled={hasDirect}
                            onClick={() => handleGrantUserPermission(record.id, 'direct')}
                          >
                            分配直接权限
                          </Button>
                          <Button 
                            type="text" 
                            size="small"
                            danger
                            disabled={hasRestricted}
                            onClick={() => handleGrantUserPermission(record.id, 'restricted')}
                          >
                            设置限制权限
                          </Button>
                        </Space>
                      )
                    }
                  }
                ]}
              />
            </TabPane>
          </Tabs>
        </div>
      </Modal>
    </div>
  )
}

// 使用页面级权限校验
export default withPagePermission(UsersPage, {
  permission: 'user.read'
})
