'use client'

import { useRouter } from 'next/navigation'

export default function CreatorDashboard() {
  const router = useRouter()

  return (
    <div className="p-8">
      {/* 欢迎区 */}
      <div className="bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-3xl p-10 mb-8 border-4 border-indigo-200 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
            <span className="text-3xl">👋</span>
          </div>
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              欢迎回来，创作者！
            </h1>
            <p className="text-gray-600 text-lg mt-1">今天也要创作出精彩的漫画哦 ✨</p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { icon: '📚', label: '总作品数', value: 0, color: 'indigo' },
          { icon: '👁️', label: '总浏览量', value: 0, color: 'purple' },
          { icon: '❤️', label: '总点赞数', value: 0, color: 'pink' },
          { icon: '⭐', label: '总收藏数', value: 0, color: 'cyan' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl p-8 shadow-xl border-4 border-indigo-200/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-5xl">{stat.icon}</span>
            </div>
            <p className="text-gray-500 text-sm font-bold mb-2">{stat.label}</p>
            <p className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => router.push('/creator/create')}
          className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-10 shadow-2xl text-white text-left hover:shadow-3xl transition-all"
        >
          <div className="text-6xl mb-4">✨</div>
          <h3 className="text-3xl font-black mb-2">创作新漫画</h3>
          <p className="text-indigo-100 text-lg">用AI将你的创意变成精彩漫画</p>
        </button>

        <button
          onClick={() => router.push('/creator/works')}
          className="bg-gradient-to-br from-cyan-500 to-teal-500 rounded-3xl p-10 shadow-2xl text-white text-left hover:shadow-3xl transition-all"
        >
          <div className="text-6xl mb-4">📖</div>
          <h3 className="text-3xl font-black mb-2">管理作品</h3>
          <p className="text-cyan-100 text-lg">查看和编辑你的所有漫画作品</p>
        </button>
      </div>

      {/* 最近作品 */}
      <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-indigo-200/50">
        <h2 className="text-2xl font-black text-gray-800 mb-6">最近作品</h2>
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-indigo-100 rounded-3xl flex items-center justify-center">
            <span className="text-5xl">🎨</span>
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">还没有作品</h3>
          <p className="text-gray-500 mb-6">开始你的第一个创作吧！</p>
          <button
            onClick={() => router.push('/creator/create')}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all"
          >
            立即创作
          </button>
        </div>
      </div>
    </div>
  )
}
