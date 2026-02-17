'use client'

import { UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { Avatar, Button, Dropdown, MenuProps, Skeleton } from 'antd'
import { useParams } from 'next/navigation'
import { useSession, signIn, signOut } from 'next-auth/react'
import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import BrandLogo from '@/components/BrandLogo'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const [menus, setMenus] = useState<any[]>([])
  const params = useParams()
  const locale = params?.locale || 'en'
  const t = useTranslations('main')
  const tCommon = useTranslations('main.common')

  useEffect(() => {
    fetch(`/api/main-menus?lang=${locale}&isTop=true&status=active`)
      .then(res => res.json())
      .then(setMenus)
  }, [locale])

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: <Link href="/profile">{t('navigation.profile')}</Link>,
      icon: <UserOutlined />,
    },
    // {
    //   key: 'vip',
    //   label: <Link href="/vip">{t('navigation.vipCenter')}</Link>,
    //   icon: <span style={{color:'#fbbf24'}}>🌟</span>,
    // },
    // {
    //   key: 'settings',
    //   label: <Link href="/profile/settings">账户设置</Link>,
    //   icon: <SettingOutlined />,
    // },
    {
      type: 'divider',
    },
    {
      key: 'signout',
      danger: true,
      label: t('navigation.logout'),
      onClick: () => signOut(),
      icon: <LogoutOutlined />,
    },
  ]

  const defaultMenus = [
    { id: '0', path: '/', name: '首页' },
    { id: '1', path: '/comic', name: '漫画广场' },
    // { id: '2', path: '/create', name: '创作中心' },
    // { id: '3', path: '/gallery', name: '作品展示' },
    { id: '4', path: 'https://blog.jumpnav.com', name: '博客' },
    { id: '5', path: '/about', name: '关于我们' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* AI漫画风格导航栏 */}
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-white/95 to-purple-50/95 dark:from-gray-900/95 dark:to-purple-900/30 backdrop-blur-md border-b-2 border-purple-200/40 dark:border-purple-800/40 shadow-xl">
        {/* 漫画风格装饰线 */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - 漫画风格设计 */}
            <div className="relative">
              <BrandLogo />
              {/* 漫画风格装饰 */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 rounded-full opacity-80"></div>
            </div>

            {/* 桌面端导航链接 - 漫画风格样式 */}
            <div className="hidden md:flex items-center space-x-8">
              {(menus.length === 0 ? defaultMenus : menus).map(menu => {
                const isExternal = /^https?:\/\//.test(menu.path)
                return (
                  <Link
                    key={menu.id}
                    href={menu.path}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className={`relative px-4 py-2 text-base font-bold transition-all duration-300 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20
                      ${pathname === menu.path ? 
                        'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 shadow-md after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-0 after:w-8 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-purple-600 after:to-pink-600' : 
                        'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
                      }
                    `}
                  >
                    {menu.name || menu.path}
                    {pathname === menu.path && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                    )}
                  </Link>
                )
              })}
            </div>

            {/* 右侧操作区 - 增强设计 */}
            <div className="flex items-center space-x-4">
              {/* 语言切换 */}
              <div className="relative">
                <LanguageSwitcher />
              </div>

              {/* 用户菜单等内容 */}
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
                    className="!bg-gradient-to-r !from-purple-600 !to-pink-600 hover:!from-purple-700 hover:!to-pink-700 !border-purple-600 hover:!border-purple-700 shadow-lg hover:shadow-xl !font-bold !rounded-xl transition-all duration-300 transform hover:scale-105"
                    style={{ 
                      background: 'linear-gradient(135deg, #9333ea, #ec4899)', 
                      borderColor: '#9333ea',
                      boxShadow: '0 4px 12px rgba(147, 51, 234, 0.4)'
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span>🔐</span>
                      {t('navigation.loginRegister')}
                    </span>
                  </Button>
                )}

                {status === 'authenticated' && session?.user && (
                  <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
                    <div className="flex items-center space-x-2 cursor-pointer transition-all duration-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl p-2">
                      <div className="relative">
                        <Avatar src={session.user.image || session.user.avatar} icon={<UserOutlined />} alt={session.user.image || session.user.avatar} className="border-2 border-purple-200 dark:border-purple-800" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                      </div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 hidden sm:inline">
                        {session.user.name || session.user.email}
                      </span>
                    </div>
                  </Dropdown>
                )}
              </div>
              {/* 移动端汉堡菜单按钮，放到头像右侧 */}
              <button
                className="md:hidden p-2 ml-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
                onClick={() => setMobileMenuOpen(true)}
                aria-label={t('navigation.openMenu')}
              >
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 移动端菜单抽屉 */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute right-0 top-0 w-4/5 max-w-xs h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* 顶部Logo+关闭按钮 */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <Link href="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
                <img src="/logo.jpg" alt="Logo" className="w-12 h-12 rounded-lg object-cover" />
                <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI漫画平台
                </span>
              </Link>
              <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setMobileMenuOpen(false)} aria-label={t('navigation.closeMenu')}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* 菜单项 */}
            <nav className="flex flex-col gap-4 px-6 py-8 flex-1">
              {(menus.length === 0 ? defaultMenus : menus).map(menu => {
                const isExternal = /^https?:\/\//.test(menu.path)
                return (
                  <Link
                    key={menu.id}
                    href={menu.path}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className={`block rounded-xl py-4 px-3 text-lg font-semibold transition-colors duration-200 text-left relative
                      ${pathname === menu.path ? 'text-purple-700 dark:text-purple-400 font-bold after:absolute after:left-3 after:bottom-1 after:w-8 after:h-1.5 after:rounded-full after:bg-gradient-to-r after:from-purple-600 after:to-pink-600' : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 hover:bg-purple-50 dark:hover:text-purple-400 dark:hover:bg-gray-800'}
                    `}
                    onClick={() => setMobileMenuOpen(false)}
                  >{menu.name || menu.path}</Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* 主要内容 */}
      <main className="flex-1">
        {children}
      </main>

      {/* AI漫画风格页脚 */}
      <footer className="bg-gradient-to-br from-white/90 to-purple-50/80 dark:from-gray-900/90 dark:to-purple-900/30 backdrop-blur-sm border-t-2 border-purple-200/40 dark:border-purple-800/40">
        {/* 漫画风格装饰线 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 漫画装饰元素 */}
          <div className="relative">
            <div className="absolute top-0 left-0 w-20 h-20 opacity-8">
              <svg viewBox="0 0 100 100" className="w-full h-full text-purple-600">
                <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="2"/>
                <circle cx="50" cy="50" r="15" fill="currentColor" opacity="0.4"/>
              </svg>
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 opacity-8">
              <svg viewBox="0 0 100 100" className="w-full h-full text-pink-600">
                <path d="M30 30 L70 30 L70 70 L30 70 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
                <path d="M40 40 L60 40 L60 60 L40 60 Z" fill="currentColor" opacity="0.5"/>
              </svg>
            </div>
          </div>
          
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <BrandLogo className="mb-0" />
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-lg font-black">漫</span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-md">
                AI驱动的漫画创作平台，让每个人都能成为漫画家。用人工智能释放你的创意，创作属于你的精彩故事。
              </p>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-16 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600"></div>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">创意无限</span>
                <div className="w-16 h-0.5 bg-gradient-to-r from-pink-600 to-blue-600"></div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">帮</span>
                帮助支持
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 flex items-center gap-2 hover:translate-x-1">
                    <span className="w-1 h-1 bg-purple-600 rounded-full"></span>
                    联系我们
                  </Link>
                </li>
                <li>
                  <Link href="/feedback" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 flex items-center gap-2 hover:translate-x-1">
                    <span className="w-1 h-1 bg-purple-600 rounded-full"></span>
                    意见反馈
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="w-6 h-6 bg-pink-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">关</span>
                关于我们
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 flex items-center gap-2 hover:translate-x-1">
                    <span className="w-1 h-1 bg-pink-600 rounded-full"></span>
                    关于平台
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 flex items-center gap-2 hover:translate-x-1">
                    <span className="w-1 h-1 bg-pink-600 rounded-full"></span>
                    隐私政策
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 flex items-center gap-2 hover:translate-x-1">
                    <span className="w-1 h-1 bg-pink-600 rounded-full"></span>
                    服务条款
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* 底部版权信息 */}
          <div className="relative mt-12 pt-8 border-t border-purple-200/30 dark:border-purple-800/30">
            <div className="text-center">
              <div className="inline-flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>© 2024 AI漫画平台 版权所有</span>
                <div className="w-1 h-1 bg-purple-600 rounded-full"></div>
                <span>用AI创作精彩漫画</span>
                <div className="w-1 h-1 bg-pink-600 rounded-full"></div>
                <span>释放无限创意</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
