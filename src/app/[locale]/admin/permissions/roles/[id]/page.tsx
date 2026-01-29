'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { Button, Card, Table, Space, Tag, message, Checkbox, Divider, Row, Col, Statistic } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, UserOutlined, KeyOutlined } from '@ant-design/icons'
import { withPagePermission } from '@/lib/withPagePermission'

interface Role {
  id: string
  name: string
  displayName: string
  description?: string
  isSystem: boolean
  permissions: string[]
  userCount: number
}

interface Permission {
  id: string
  name: string
  displayName: string
  description?: string
  module: string
  action: string
  resource?: string
  isSystem: boolean
}

interface PermissionGroup {
  module: string
  permissions: Permission[]
}

function RolePermissionPage() {
  const t = useTranslations('admin.permissions')
  const params = useParams()
  const router = useRouter()
  const [role, setRole] = useState<Role | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const roleId = params.id as string

  // 获取角色详情
  const fetchRole = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/permissions/roles/${roleId}`)
      const result = await response.json()

      if (result.success) {
        setRole(result.data)
        setSelectedPermissions(result.data.permissions || [])
      } else {
        message.error(result.error || '获取角色详情失败')
        router.push('/admin/permissions')
      }
    } catch (error) {
      message.error('获取角色详情失败')
      console.error('Error fetching role:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取权限列表
  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/admin/permissions/permissions')
      const result = await response.json()

      if (result.success) {
        setPermissions(result.data)
        
        // 按模块分组权限
        const groups: PermissionGroup[] = []
        const moduleMap = new Map<string, Permission[]>()
        
        result.data.forEach((permission: Permission) => {
          if (!moduleMap.has(permission.module)) {
            moduleMap.set(permission.module, [])
          }
          moduleMap.get(permission.module)!.push(permission)
        })
        
        moduleMap.forEach((perms, module) => {
          groups.push({ module, permissions: perms })
        })
        
        setPermissionGroups(groups)
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    }
  }

  useEffect(() => {
    if (roleId) {
      fetchRole()
      fetchPermissions()
    }
  }, [roleId])

  // 处理权限选择
  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId])
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId))
    }
  }

  // 处理模块全选
  const handleModuleSelectAll = (module: string, checked: boolean) => {
    const modulePermissions = permissionGroups
      .find(group => group.module === module)
      ?.permissions.map(p => p.id) || []
    
    if (checked) {
      setSelectedPermissions(prev => [
        ...prev.filter(id => !modulePermissions.includes(id)),
        ...modulePermissions
      ])
    } else {
      setSelectedPermissions(prev => 
        prev.filter(id => !modulePermissions.includes(id))
      )
    }
  }

  // 检查模块是否全选
  const isModuleSelected = (module: string) => {
    const modulePermissions = permissionGroups
      .find(group => group.module === module)
      ?.permissions.map(p => p.id) || []
    
    return modulePermissions.length > 0 && 
           modulePermissions.every(id => selectedPermissions.includes(id))
  }

  // 检查模块是否部分选择
  const isModuleIndeterminate = (module: string) => {
    const modulePermissions = permissionGroups
      .find(group => group.module === module)
      ?.permissions.map(p => p.id) || []
    
    const selectedCount = modulePermissions.filter(id => 
      selectedPermissions.includes(id)
    ).length
    
    return selectedCount > 0 && selectedCount < modulePermissions.length
  }

  // 保存权限设置
  const handleSave = async () => {
    if (!role) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/permissions/roles/${roleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...role,
          permissions: selectedPermissions
        })
      })

      const result = await response.json()
      if (result.success) {
        message.success('权限设置保存成功')
        setRole(prev => prev ? { ...prev, permissions: selectedPermissions } : null)
      } else {
        message.error(result.error || '保存失败')
      }
    } catch (error) {
      message.error('保存失败')
      console.error('Error saving permissions:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6">加载中...</div>
  }

  if (!role) {
    return <div className="p-6">角色不存在</div>
  }

  const moduleColumns = [
    {
      title: '权限名称',
      key: 'displayName',
      render: (permission: Permission) => (
        <div>
          <div className="font-medium">{permission.displayName}</div>
          <div className="text-sm text-gray-500">{permission.name}</div>
          {permission.description && (
            <div className="text-xs text-gray-400 mt-1">{permission.description}</div>
          )}
        </div>
      )
    },
    {
      title: '动作',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => <Tag color="blue">{action}</Tag>
    },
    {
      title: '资源',
      dataIndex: 'resource',
      key: 'resource',
      render: (resource: string) => resource || '-'
    },
    {
      title: '类型',
      key: 'isSystem',
      render: (permission: Permission) => (
        <Tag color={permission.isSystem ? 'red' : 'blue'}>
          {permission.isSystem ? '系统权限' : '自定义权限'}
        </Tag>
      )
    },
    {
      title: '选择',
      key: 'select',
      render: (permission: Permission) => (
        <Checkbox
          checked={selectedPermissions.includes(permission.id)}
          onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
        />
      )
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.push('/admin/permissions')}
          className="mb-4"
        >
          返回权限管理
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{role.displayName} - 权限设置</h1>
            <p className="text-gray-600">{role.description}</p>
          </div>
          
          <Space>
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
            >
              保存设置
            </Button>
          </Space>
        </div>
      </div>

      {/* 统计信息 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="已选权限"
              value={selectedPermissions.length}
              prefix={<KeyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总权限数"
              value={permissions.length}
              prefix={<KeyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="用户数量"
              value={role.userCount}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="权限模块"
              value={permissionGroups.length}
              prefix={<KeyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 权限设置 */}
      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-medium">权限配置</h3>
          <p className="text-gray-600">为角色分配相应的权限</p>
        </div>

        {permissionGroups.map((group, index) => (
          <div key={group.module} className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium capitalize">{group.module} 模块</h4>
              <Checkbox
                checked={isModuleSelected(group.module)}
                indeterminate={isModuleIndeterminate(group.module)}
                onChange={(e) => handleModuleSelectAll(group.module, e.target.checked)}
              >
                全选
              </Checkbox>
            </div>
            
            <Table
              columns={moduleColumns}
              dataSource={group.permissions}
              rowKey="id"
              pagination={false}
              size="small"
            />
            
            {index < permissionGroups.length - 1 && <Divider />}
          </div>
        ))}
      </Card>
    </div>
  )
}

// 使用页面级权限校验
export default withPagePermission(RolePermissionPage, {
  permission: 'permission.read'
})
