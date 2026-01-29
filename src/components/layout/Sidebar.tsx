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
} from '@ant-design/icons'
import { Layout, Menu, Typography, theme } from 'antd'
import type { MenuProps } from 'antd'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { MenuItem, menuItems } from '@/config/menu'

const { Sider } = Layout
const { Title } = Typography

const getIcon = (iconName?: string) => {
  switch (iconName) {
    case 'dashboard':
      return <DashboardOutlined />
    case 'setting':
      return <SettingOutlined />
    case 'file':
      return <FileOutlined />
    case 'user':
      return <UserOutlined />
    case 'order':
      return <ShoppingCartOutlined />
    case 'statistics':
      return <BarChartOutlined />
    case 'team':
      return <TeamOutlined />
    case 'message':
      return <MessageOutlined />
    default:
      return null
  }
}

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar = ({ collapsed }: SidebarProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const { token } = theme.useToken()
  const t = useTranslations()

  const handleMenuClick = (path: string) => {
    router.push(path)
  }

  const convertToMenuItems = (items: MenuItem[]): MenuProps['items'] => {
    return items.map((item) => {
      // Use the label from menu config as a translation key
      const translatedLabel = t(item.label)

      if (item.children) {
        return {
          key: item.key,
          icon: getIcon(item.icon),
          label: translatedLabel,
          children: convertToMenuItems(item.children),
        }
      }
      return {
        key: item.key,
        icon: getIcon(item.icon),
        label: translatedLabel,
        onClick: () => handleMenuClick(item.path),
      }
    })
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      theme="light"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
        zIndex: 1001,
      }}
    >
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
      }}>
        <Title level={4} style={{
          margin: 0,
          color: token.colorPrimary,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          transition: 'all 0.2s',
        }}>
          {collapsed ? t('admin.layout.admin') : 'Admin Panel'}
        </Title>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        defaultOpenKeys={['system', 'content']}
        style={{
          borderRight: 0,
          background: token.colorBgContainer,
        }}
        items={convertToMenuItems(menuItems)}
      />
    </Sider>
  )
}

export default Sidebar
