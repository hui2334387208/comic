import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '创作中心 - AI漫画平台',
  description: '创作者中心，管理你的作品和收益',
}

export default function CreatorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
          创作中心
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 统计卡片 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-orange-200/40">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 dark:text-gray-400">总作品数</span>
              <span className="text-3xl">📚</span>
            </div>
            <div className="text-3xl font-bold text-orange-600">0</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-200/40">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 dark:text-gray-400">总浏览量</span>
              <span className="text-3xl">👁️</span>
            </div>
            <div className="text-3xl font-bold text-amber-600">0</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-yellow-200/40">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 dark:text-gray-400">总收益</span>
              <span className="text-3xl">💰</span>
            </div>
            <div className="text-3xl font-bold text-yellow-600">¥0</div>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">快速操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a href="/creator/create" className="block bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="text-white">
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="text-2xl font-bold mb-2">创作新漫画</h3>
                <p className="text-orange-100">使用AI快速生成精彩漫画</p>
              </div>
            </a>

            <a href="/creator/works" className="block bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="text-white">
                <div className="text-4xl mb-4">📖</div>
                <h3 className="text-2xl font-bold mb-2">管理作品</h3>
                <p className="text-blue-100">查看和编辑你的所有作品</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
