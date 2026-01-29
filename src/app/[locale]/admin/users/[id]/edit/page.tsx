'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { Button, Form, Input, Select, Card, message, Space, Avatar, Upload } from 'antd'
import { UserOutlined, ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { UploadOutlined } from '@ant-design/icons'
import { withPagePermission } from '@/lib/withPagePermission'

const { Option } = Select
const { TextArea } = Input

interface User {
  id: string
  name: string
  email: string
  username: string
  role: string
  avatar?: string
  profile?: string
}

interface Role {
  id: string
  name: string
  displayName: string
  description?: string
}

function EditUserPage() {
  const t = useTranslations('admin.users')
  const params = useParams()
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [roles, setRoles] = useState<Role[]>([])

  const userId = params.id as string

  // 获取用户信息
  const fetchUser = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      const result = await response.json()

      if (result.success) {
        setUser(result.data)
        form.setFieldsValue({
          name: result.data.name,
          email: result.data.email,
          username: result.data.username,
          profile: result.data.profile,
          avatar: result.data.avatar,
          roles: result.data.roles?.map((r: any) => r.id) || []
        })
      } else {
        message.error(result.error || '获取用户信息失败')
        router.push('/admin/users')
      }
    } catch (error) {
      message.error('获取用户信息失败')
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取角色列表
  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles')
      const result = await response.json()
      if (result.success) {
        setRoles(result.data)
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchUser()
      fetchRoles()
    }
  }, [userId])

  // 保存用户信息
  const handleSave = async (values: any) => {
    setLoading(true)
    try {
      const { roles, ...userData } = values
      
      // 更新用户基本信息
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const result = await response.json()
      if (result.success) {
        // 更新用户角色
        if (roles) {
          await updateUserRoles(roles)
        }
        message.success('用户信息更新成功')
        router.push(`/admin/users/${userId}`)
      } else {
        message.error(result.error || '更新用户信息失败')
      }
    } catch (error) {
      message.error('更新用户信息失败')
      console.error('Error updating user:', error)
    } finally {
      setLoading(false)
    }
  }

  // 更新用户角色
  const updateUserRoles = async (newRoleIds: string[]) => {
    try {
      // 获取当前用户角色
      const currentRolesResponse = await fetch(`/api/admin/user-roles?userId=${userId}`)
      const currentRolesResult = await currentRolesResponse.json()
      const currentRoleIds = currentRolesResult.success ? 
        currentRolesResult.data.map((ur: any) => ur.roleId) : []

      // 删除不再需要的角色
      const rolesToRemove = currentRoleIds.filter((id: string) => !newRoleIds.includes(id))
      for (const roleId of rolesToRemove) {
        const userRole = currentRolesResult.data.find((ur: any) => ur.roleId === roleId)
        if (userRole) {
          await fetch(`/api/admin/user-roles?userRoleId=${userRole.id}`, {
            method: 'DELETE'
          })
        }
      }

      // 添加新角色
      const rolesToAdd = newRoleIds.filter((id: string) => !currentRoleIds.includes(id))
      for (const roleId of rolesToAdd) {
        await fetch('/api/admin/user-roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            roleId,
            reason: '管理员分配'
          })
        })
      }
    } catch (error) {
      console.error('Error updating user roles:', error)
    }
  }

  // 头像上传
  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      if (result.success) {
        form.setFieldValue('avatar', result.data.url)
        setUser(prev => prev ? { ...prev, avatar: result.data.url } : null)
        message.success('头像上传成功')
      } else {
        message.error(result.error || '头像上传失败')
      }
    } catch (error) {
      message.error('头像上传失败')
      console.error('Error uploading avatar:', error)
    }
  }

  if (loading && !user) {
    return <div className="p-6">加载中...</div>
  }

  if (!user) {
    return <div className="p-6">用户不存在</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.push(`/admin/users/${userId}`)}
          className="mb-4"
        >
          返回用户详情
        </Button>
        
        <h1 className="text-2xl font-bold mb-2">编辑用户</h1>
        <p className="text-gray-600">修改用户信息和权限</p>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="max-w-2xl"
        >
          <div className="text-center mb-6">
            <Avatar 
              size={80} 
              src={user.avatar} 
              icon={<UserOutlined />}
              className="mb-2"
            />
            <div>
              <Upload
                beforeUpload={handleAvatarUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />} size="small">
                  更换头像
                </Button>
              </Upload>
            </div>
          </div>

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
            label="姓名"
            name="name"
            rules={[
              { max: 50, message: '姓名最多50个字符' }
            ]}
          >
            <Input placeholder="请输入姓名" />
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

          <Form.Item
            label="角色"
            name="roles"
          >
            <Select 
              mode="multiple" 
              placeholder="请选择角色"
              options={roles.map(role => ({
                label: role.displayName,
                value: role.id
              }))}
            />
          </Form.Item>


          <Form.Item
            label="个人简介"
            name="profile"
            rules={[
              { max: 500, message: '个人简介最多500个字符' }
            ]}
          >
            <TextArea 
              rows={4} 
              placeholder="请输入个人简介"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SaveOutlined />}
              >
                保存
              </Button>
              <Button onClick={() => router.push(`/admin/users/${userId}`)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default withPagePermission(EditUserPage, {
  permission: 'user.update'
})
