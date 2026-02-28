'use client'

import { useRouter, usePathname } from 'next/navigation'

const CreatorSidebar = ({ collapsed }: { collapsed: boolean }) => {
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    { path: '/creator', icon: '🏠', label: '创作中心' },
    { path: '/creator/works', icon: '📚', label: '我的作品' },
    { path: '/creator/create', icon: '✨', label: '创作漫画' },
    { path: '/creator/analytics', icon: '📊', label: '数据分析' },
    { path: '/creator/earnings', icon: '💰', label: '收益管理' },
    { path: '/creator/review', icon: '📋', label: '内容审核' },
    { path: '/creator/comments', icon: '💬', label: '互动管理' },
    { path: '/creator/settings', icon: '⚙️', label: '创作设置' },
  ]

  return (
    <div className={`h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 border-r-4 border-indigo-200 shadow-2xl transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'}`}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b-2 border-indigo-200 bg-indigo-100/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
            <span className="text-white font-black text-xl">创</span>
          </div>
          {!collapsed && (
            <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              创作者中心
            </h1>
          )}
        </div>
      </div>

      {/* 菜单 */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl scale-105'
                  : 'bg-white/50 text-gray-700 hover:bg-indigo-50'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              {!collapsed && <span className="font-bold">{item.label}</span>}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default CreatorSidebar
