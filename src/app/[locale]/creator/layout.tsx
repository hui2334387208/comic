'use client'

import { UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { Avatar, Button, Dropdown, MenuProps, Skeleton } from 'antd'
import { useParams } from 'next/navigation'
import { useSession, signIn, signOut } from 'next-auth/react'
import React, { useState } from 'react'
import { useTranslations } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import BrandLogo from '@/components/BrandLogo'

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const params = useParams()
  const t = useTranslations('creator')

  // 创作者端菜单
  const creatorMenus = [
    { id: '1', path: '/creator', name: '创作中心' },
    { id: '2', path: '/creator/works', name: '我的作品' },
    { id: '3', path: '/creator/create', name: '创作漫画' },
    { id: '4', path: '/creator/analytics', name: '数据分析' },
    { id: '5', path: '/creator/earnings', name: '收益管理' },
  ]

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: <Link href="/creator/profile">创作者资料</Link>,
      icon: <UserOutlined />,
    },
    {
      key: 'settings',
      label: <Link href="/creator/settings">创作设置</Link>,
      icon: <span>⚙️</span>,
    },
    {
      type: 'divider',
    },
    {
      key: 'switch-user',
      label: <Link href="/">切换到用户端</Link>,
      icon: <span>🔄</span>,
    },
    {
      type: 'divider',
    },
    {
      key: 'signout',
      danger: true,
      label: '退出登录',
      onClick: () => signOut(),
      icon: <LogoutOutlined />,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-yellow-900/20">
      {/* 创作者端导航栏 */}
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-white/95 to-orange-50/95 dark:from-gray-900/95 dark:to-orange-900/30 backdrop-blur-md border-b-2 border-orange-200/40 dark:border-orange-800/40 shadow-xl">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="relative flex items-center gap-2">
              <BrandLogo />
              <span className="hidden sm:inline-block px-3 py-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold rounded-full">
                创作者
              </span>
            </div>

            {/* 桌面端导航 */}
            <div className="hidden md:flex items-center space-x-6">
              {creatorMenus.map(menu => (
                <Link
                  key={menu.id}
                  href={menu.path}
                  className={`relative px-4 py-2 text-base font-bold transition-all duration-300 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20
                    ${pathname === menu.path ? 
                      'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 shadow-md after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-0 after:w-8 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-orange-600 after:to-amber-600' : 
                      'text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400'
                    }
                  `}
                >
                  {menu.name}
                  {pathname === menu.path && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                  )}
                </Link>
              ))}
            </div>

            {/* 右侧操作区 */}
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />

              <div className="flex items-center">
                {status === 'loading' && (
                  <div className="flex items-center space-x-2">
                    <Skeleton.Avatar active size="default" shape="circle" />
                    <Skeleton.Input style={{ width: 80, height: 32 }} active size="small" />
                  </div>
                )}

                {status === 'unauthenticated' && (
                  <Button 
                    onClick={() => signIn()} 
                    type="primary" 
                    className="!bg-gradient-to-r !from-orange-600 !to-amber-600 hover:!from-orange-700 hover:!to-amber-700 !border-orange-600 hover:!border-orange-700 shadow-lg hover:shadow-xl !font-bold !rounded-xl transition-all duration-300 transform hover:scale-105"
                    style={{ 
                      background: 'linear-gradient(135deg, #ea580c, #f59e0b)', 
                      borderColor: '#ea580c',
                      boxShadow: '0 4px 12px rgba(234, 88, 12, 0.4)'
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span>🎨</span>
                      登录创作
                    </span>
                  </Button>
                )}

                {status === 'authenticated' && session?.user && (
                  <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
                    <div className="flex items-center space-x-2 cursor-pointer transition-all duration-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl p-2">
                      <div className="relative">
                        <Avatar src={session.user.image || session.user.avatar} icon={<UserOutlined />} className="border-2 border-orange-200 dark:border-orange-800" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                      </div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 hidden sm:inline">
                        {session.user.name || session.user.email}
                      </span>
                    </div>
                  </Dropdown>
                )}
              </div>

              {/* 移动端菜单按钮 */}
              <button
                className="md:hidden p-2 ml-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
                onClick={() => setMobileMenuOpen(true)}
              >
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute right-0 top-0 w-4/5 max-w-xs h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <span className="text-lg font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                创作者中心
              </span>
              <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setMobileMenuOpen(false)}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-4 px-6 py-8 flex-1">
              {creatorMenus.map(menu => (
                <Link
                  key={menu.id}
                  href={menu.path}
                  className={`block rounded-xl py-4 px-3 text-lg font-semibold transition-colors duration-200 text-left
                    ${pathname === menu.path ? 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30' : 'text-gray-600 dark:text-gray-300 hover:text-orange-600 hover:bg-orange-50 dark:hover:text-orange-400 dark:hover:bg-gray-800'}
                  `}
                  onClick={() => setMobileMenuOpen(false)}
                >{menu.name}</Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* 主要内容 */}
      <main className="flex-1">
        {children}
      </main>

      {/* 页脚 */}
      <footer className="bg-gradient-to-br from-white/90 to-orange-50/80 dark:from-gray-900/90 dark:to-orange-900/30 backdrop-blur-sm border-t-2 border-orange-200/40 dark:border-orange-800/40">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            © 2024 AI漫画平台 创作者中心 · 用AI释放创作力
          </div>
        </div>
      </footer>
    </div>
  )
}
