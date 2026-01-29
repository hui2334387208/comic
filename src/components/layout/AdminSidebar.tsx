'use client'

import {
  DashboardOutlined,
  SettingOutlined,
  FileOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  TeamOutlined,
  MessageOutlined,
  TagsOutlined,
  CrownOutlined,
  MenuOutlined,
  KeyOutlined,
} from '@ant-design/icons'
import { Layout, Menu, Typography, Spin } from 'antd'
import type { MenuProps } from 'antd'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'

import styles from './AdminSidebar.module.css'

interface MenuItem {
  id: string
  key: string
  label: string
  path: string
  icon?: string
  children?: MenuItem[]
}

const { Sider } = Layout
const { Title } = Typography

const getIcon = (iconName?: string) => {
  switch (iconName) {
    case 'dashboard':
      return <DashboardOutlined className="text-lg" />
    case 'setting':
      return <SettingOutlined className="text-lg" />
    case 'file':
      return <FileOutlined className="text-lg" />
    case 'user':
      return <UserOutlined className="text-lg" />
    case 'order':
      return <ShoppingCartOutlined className="text-lg" />
    case 'statistics':
      return <BarChartOutlined className="text-lg" />
    case 'team':
      return <TeamOutlined className="text-lg" />
    case 'message':
      return <MessageOutlined className="text-lg" />
    case 'tags':
      return <TagsOutlined className="text-lg" />
    case 'tag':
      return <TagsOutlined className="text-lg" />
    case 'vip':
      return <CrownOutlined className="text-lg" />
    case 'menu':
      return <MenuOutlined className="text-lg" />
    case 'key':
      return <KeyOutlined className="text-lg" />
    default:
      return <MenuOutlined className="text-lg" />
  }
}

interface SidebarProps {
  collapsed: boolean;
}

const AdminSidebar = ({ collapsed }: SidebarProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserMenus()
  }, [])

  const loadUserMenus = async () => {
    try {
      const response = await fetch('/api/admin/menus')
      const result = await response.json()
      if (result.success) {
        setMenus(result.data)
      }
    } catch (error) {
      console.error('加载用户菜单失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMenuClick = (path: string) => {
    router.push(path)
  }

  const convertToMenuItems = (items: MenuItem[]): MenuProps['items'] => {
    return items.map((item) => {
      const isActive = pathname === item.path
      const isHovered = hoveredItem === item.key

      if (item.children && item.children.length > 0) {
        return {
          key: item.key,
          icon: getIcon(item.icon),
          label: (
            <span className={`transition-all duration-300 ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-500'}`}>
              {t(item.label)}
            </span>
          ),
          children: convertToMenuItems(item.children),
        }
      }
      return {
        key: item.key,
        icon: getIcon(item.icon),
        label: (
          <span className={`transition-all duration-300 ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-500'}`}>
            {t(item.label)}
          </span>
        ),
        onClick: () => handleMenuClick(item.path),
        onMouseEnter: () => setHoveredItem(item.key),
        onMouseLeave: () => setHoveredItem(null),
        className: `transition-all duration-300 rounded-lg mx-2 my-1 ${
          isActive 
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 shadow-sm' 
            : isHovered 
            ? 'bg-gradient-to-r from-gray-50 to-blue-50 shadow-sm' 
            : 'hover:bg-gray-50'
        }`,
      }
    })
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={280}
      collapsedWidth={80}
      className={`${styles.modernSidebar} overflow-auto h-screen bg-gradient-to-b from-white to-slate-50 backdrop-blur-xl border-r border-slate-200/80 shadow-2xl shadow-black/10`}
    >
      {/* 现代化头部 */}
      <div className="relative h-16 flex items-center justify-center border-b border-gray-200/50 bg-gradient-to-r from-white to-gray-50/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
        <div className="relative flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">智</span>
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <Title 
                level={4} 
                className="!m-0 font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300 ease-out"
              >
                文鳐管理后台
              </Title>
            </div>
          )}
        </div>
      </div>

      {/* 现代化菜单 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Spin size="large" />
          </div>
        ) : (
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            defaultOpenKeys={['settings']}
            className="!border-0 !bg-transparent"
            items={convertToMenuItems(menus)}
          />
        )}
      </div>

      {/* 底部装饰 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20"></div>
    </Sider>
  )
}

export default AdminSidebar
