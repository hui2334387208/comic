'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { Button, Card, Descriptions, Tag, Space, Modal, message, Tabs, Table, Timeline, Statistic, Row, Col, Avatar, Divider } from 'antd'
import { UserOutlined, EditOutlined, LockOutlined, UnlockOutlined, ArrowLeftOutlined, MailOutlined, CalendarOutlined, LoginOutlined, KeyOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { withPagePermission } from '@/lib/withPagePermission'

const { TabPane } = Tabs

interface User {
  id: string
  name: string
  email: string
  username: string
  role: string
  avatar?: string
  profile?: string
  isLocked: boolean
  lockReason?: string
  lockedAt?: string
  lockExpiresAt?: string
  failedLoginAttempts: number
  lastFailedLoginAt?: string
  recentSuccessfulLogins: number
  lastSuccessfulLoginAt?: string
  loginFrequencyWarning: boolean
  created_at: string
  updated_at: string
}

interface LoginLog {
  id: string
  action: string
  description: string
  ip: string
  userAgent: string
  createdAt: string
}

function UserDetailPage() {
  const t = useTranslations('admin.users')
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([])
  const [userPermissions, setUserPermissions] = useState<any>(null)

  const userId = params.id as string

  // 获取用户详情
  const fetchUserDetail = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      const result = await response.json()

      if (result.success) {
        setUser(result.data)
      } else {
        message.error(result.error || '获取用户详情失败')
        router.push('/admin/users')
      }
    } catch (error) {
      message.error('获取用户详情失败')
      console.error('Error fetching user detail:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取登录日志
  const fetchLoginLogs = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/logs`)
      const result = await response.json()

      if (result.success) {
        setLoginLogs(result.data)
      }
    } catch (error) {
      console.error('Error fetching login logs:', error)
    }
  }

  // 获取用户权限信息
  const fetchUserPermissions = async () => {
    try {
      const response = await fetch(`/api/admin/user-permissions?userId=${userId}`)
      const result = await response.json()

      if (result.success) {
        setUserPermissions(result.data)
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchUserDetail()
      fetchLoginLogs()
      fetchUserPermissions()
    }
  }, [userId])

  // 锁定/解锁用户
  const handleToggleLock = async () => {
    if (!user) return

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
            fetchUserDetail()
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

  if (loading) {
    return <div className="p-6">加载中...</div>
  }

  if (!user) {
    return <div className="p-6">用户不存在</div>
  }

  const roleConfig = {
    admin: { color: 'red', text: '管理员' },
    user: { color: 'blue', text: '用户' },
    moderator: { color: 'green', text: '版主' }
  }

  const roleInfo = roleConfig[user.role as keyof typeof roleConfig] || { color: 'default', text: user.role }

  const loginLogColumns = [
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        const actionConfig = {
          login: { color: 'green', text: '登录' },
          logout: { color: 'orange', text: '退出' },
          failed_login: { color: 'red', text: '登录失败' }
        }
        const config = actionConfig[action as keyof typeof actionConfig] || { color: 'default', text: action }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip'
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.push('/admin/users')}
          className="mb-4"
        >
          返回用户列表
        </Button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar size={64} src={user.avatar} icon={<UserOutlined />} />
            <div>
              <h1 className="text-2xl font-bold mb-1">{user.name || '未设置'}</h1>
              <p className="text-gray-600 mb-2">{user.email}</p>
              <div className="flex items-center space-x-2">
                <Tag color={roleInfo.color}>{roleInfo.text}</Tag>
                <Tag color={user.isLocked ? 'red' : 'green'}>
                  {user.isLocked ? '已锁定' : '正常'}
                </Tag>
              </div>
            </div>
          </div>
          
          <Space>
            <Button 
              icon={<EditOutlined />}
              onClick={() => router.push(`/admin/users/${user.id}/edit`)}
            >
              编辑用户
            </Button>
            <Button 
              icon={user.isLocked ? <UnlockOutlined /> : <LockOutlined />}
              onClick={handleToggleLock}
              type={user.isLocked ? 'primary' : 'default'}
            >
              {user.isLocked ? '解锁' : '锁定'}
            </Button>
          </Space>
        </div>
      </div>

      <Tabs defaultActiveKey="basic">
        <TabPane tab="基本信息" key="basic">
          <Row gutter={16}>
            <Col span={16}>
              <Card title="用户信息" className="mb-4">
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="用户ID">{user.id}</Descriptions.Item>
                  <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
                  <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
                  <Descriptions.Item label="姓名">{user.name || '未设置'}</Descriptions.Item>
                  <Descriptions.Item label="角色">
                    <Tag color={roleInfo.color}>{roleInfo.text}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag color={user.isLocked ? 'red' : 'green'}>
                      {user.isLocked ? '已锁定' : '正常'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="注册时间">
                    {dayjs(user.created_at).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                  <Descriptions.Item label="最后更新">
                    {dayjs(user.updated_at).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {user.profile && (
                <Card title="个人简介" className="mb-4">
                  <p>{user.profile}</p>
                </Card>
              )}

              {user.isLocked && (
                <Card title="锁定信息" className="mb-4">
                  <Descriptions column={1} bordered>
                    <Descriptions.Item label="锁定原因">
                      {user.lockReason || '未指定原因'}
                    </Descriptions.Item>
                    <Descriptions.Item label="锁定时间">
                      {user.lockedAt ? dayjs(user.lockedAt).format('YYYY-MM-DD HH:mm:ss') : '未知'}
                    </Descriptions.Item>
                    <Descriptions.Item label="锁定过期时间">
                      {user.lockExpiresAt ? dayjs(user.lockExpiresAt).format('YYYY-MM-DD HH:mm:ss') : '永久锁定'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              )}
            </Col>

            <Col span={8}>
              <Card title="登录统计" className="mb-4">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="最近登录次数"
                      value={user.recentSuccessfulLogins}
                      prefix={<LoginOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="失败登录次数"
                      value={user.failedLoginAttempts}
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Col>
                </Row>
                
                <Divider />
                
                <div className="space-y-2">
                  <div>
                    <strong>最后成功登录：</strong>
                    <br />
                    {user.lastSuccessfulLoginAt 
                      ? dayjs(user.lastSuccessfulLoginAt).format('YYYY-MM-DD HH:mm:ss')
                      : '从未登录'
                    }
                  </div>
                  
                  {user.lastFailedLoginAt && (
                    <div>
                      <strong>最后失败登录：</strong>
                      <br />
                      {dayjs(user.lastFailedLoginAt).format('YYYY-MM-DD HH:mm:ss')}
                    </div>
                  )}
                  
                  {user.loginFrequencyWarning && (
                    <div className="text-orange-500">
                      <strong>⚠️ 频繁登录警告</strong>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="权限信息" key="permissions">
          <Row gutter={16}>
            <Col span={12}>
              <Card title="角色权限" className="mb-4">
                <div className="space-y-2">
                  <div>
                    <strong>用户角色：</strong>
                    <Tag color="blue">{roleInfo.text}</Tag>
                  </div>
                  <div>
                    <strong>通过角色获得的权限：</strong>
                    <div className="mt-2">
                      {userPermissions?.permissions?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {userPermissions.permissions.slice(0, 10).map((permission: string) => (
                            <Tag key={permission} color="green">{permission}</Tag>
                          ))}
                          {userPermissions.permissions.length > 10 && (
                            <Tag color="default">+{userPermissions.permissions.length - 10} 更多</Tag>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">无权限</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            
            <Col span={12}>
              <Card title="直接权限" className="mb-4">
                <div className="space-y-2">
                  <div>
                    <strong>直接分配的权限：</strong>
                    <div className="mt-2">
                      {userPermissions?.directPermissions?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {userPermissions.directPermissions.slice(0, 10).map((permission: string) => (
                            <Tag key={permission} color="blue">{permission}</Tag>
                          ))}
                          {userPermissions.directPermissions.length > 10 && (
                            <Tag color="default">+{userPermissions.directPermissions.length - 10} 更多</Tag>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">无直接权限</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <strong>限制权限：</strong>
                    <div className="mt-2">
                      {userPermissions?.restrictedPermissions?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {userPermissions.restrictedPermissions.map((permission: string) => (
                            <Tag key={permission} color="red">{permission}</Tag>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">无限制权限</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="登录日志" key="logs">
          <Card>
            <Table
              columns={loginLogColumns}
              dataSource={loginLogs}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
              }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default withPagePermission(UserDetailPage, {
  permissions: ['user.read'],
  requireAll: false
})
