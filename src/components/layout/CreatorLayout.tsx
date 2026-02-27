'use client'

import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, LogoutOutlined, BulbOutlined, BulbFilled, GlobalOutlined } from '@ant-design/icons'
import { Layout, Button, Dropdown, Space, Avatar, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import { useRouter, useParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'

import { useRouter as useIntlRouter, usePathname } from '@/i18n/navigation'
import { loggerClient } from '@/lib/logger-client'

import CreatorSidebar from './CreatorSidebar'

const { Content } = Layout

interface CreatorLayoutProps {
  children: React.ReactNode;
}

const CreatorLayout = ({ children }: CreatorLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const t = useTranslations('creator')
  const intlRouter = useIntlRouter()
  const pathname = usePathname()
  const currentLocale = params.locale as string

  useEffect(() => {
    // Check system preference for dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDarkMode(prefersDark)
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  }, [])

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ]

  const handleUserMenuClick: MenuProps['onClick'] = async ({ key }) => {
    switch (key) {
      case 'profile':
        router.push('/creator/profile')
        break
      case 'logout':
        if (session?.user) {
          await loggerClient.info({
            module: 'auth',
            action: 'logout',
            description: `创作者退出登录 (${session.user.email})`,
            userId: session.user.id,
          })
        }
        await signOut({ redirect: false })
        router.push(`/${params.locale}/sign-in`)
        break
    }
  }

  const handleThemeChange = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light')
  }

  const localeMenuItems: MenuProps['items'] = [
    {
      key: 'en',
      label: 'English',
    },
    {
      key: 'zh',
      label: '中文',
    },
  ]

  const handleLocaleChange: MenuProps['onClick'] = ({ key }) => {
    if (key !== currentLocale) {
      intlRouter.push(pathname, { locale: key })
    }
  }

  return (
    <div className="flex h-screen">
      <CreatorSidebar collapsed={collapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 flex items-center justify-between h-16 shadow-sm bg-white border-b border-gray-200 flex-shrink-0">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-base w-16 h-16 text-gray-700 hover:text-gray-900"
          />
          <Space size="large">
            <Tooltip title={isDarkMode ? '浅色模式' : '深色模式'}>
              <Button
                type="text"
                icon={isDarkMode ? <BulbFilled className="text-yellow-500" /> : <BulbOutlined />}
                onClick={handleThemeChange}
                className="text-base w-10 h-10 flex items-center justify-center text-gray-700 hover:text-gray-900"
              />
            </Tooltip>

            <Dropdown menu={{ items: localeMenuItems, onClick: handleLocaleChange, selectedKeys: [currentLocale] }} placement="bottomRight">
              <Button
                type="text"
                icon={<GlobalOutlined />}
                className="text-base w-10 h-10 flex items-center justify-center text-gray-700 hover:text-gray-900"
              />
            </Dropdown>

            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
              <Space className="cursor-pointer px-3 text-gray-700 hover:text-gray-900">
                <Avatar
                  src={session?.user?.avatar}
                  icon={!session?.user?.avatar && <UserOutlined />}
                  className="bg-purple-500 text-white"
                />
                <span>{session?.user?.name || '创作者'}</span>
              </Space>
            </Dropdown>
          </Space>
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="m-6 rounded-lg bg-white">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatorLayout
