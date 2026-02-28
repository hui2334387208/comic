'use client'

import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { Button, Dropdown, Space, Avatar } from 'antd'
import type { MenuProps } from 'antd'
import { useRouter, useParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

import CreatorSidebar from './CreatorSidebar'

const CreatorLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '个人资料' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ]

  const handleUserMenuClick: MenuProps['onClick'] = async ({ key }) => {
    if (key === 'logout') {
      await signOut({ redirect: false })
      router.push(`/${params.locale}/sign-in`)
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* 左侧菜单 */}
      <CreatorSidebar collapsed={collapsed} />
      
      {/* 右侧内容 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部导航 */}
        <div className="h-16 bg-indigo-100/50 border-b-2 border-indigo-200 shadow-lg flex items-center justify-between px-6">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-indigo-600 hover:bg-indigo-200/50"
          />
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }}>
            <Space className="cursor-pointer hover:bg-indigo-200/30 px-3 py-2 rounded-lg transition-all">
              <Avatar 
                src={session?.user?.avatar} 
                icon={<UserOutlined />} 
                className="bg-gradient-to-br from-indigo-600 to-purple-600" 
              />
              <span className="font-bold text-gray-800">{session?.user?.name || '创作者'}</span>
            </Space>
          </Dropdown>
        </div>
        
        {/* 主内容 */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

export default CreatorLayout
