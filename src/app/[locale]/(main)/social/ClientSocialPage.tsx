'use client'

import React, { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'

interface SocialStats {
  battles: number
  collaborations: number
  chains: number
  mentors: number
}

const ClientSocialPage: React.FC = () => {
  const [stats, setStats] = useState<SocialStats>({
    battles: 0,
    collaborations: 0,
    chains: 0,
    mentors: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // 并行获取各个模块的统计数据
      const [battlesRes, collaborationsRes, chainsRes, mentorsRes] = await Promise.all([
        fetch('/api/social/battles?limit=1'),
        fetch('/api/social/collaborations?limit=1'),
        fetch('/api/social/chains?limit=1'),
        fetch('/api/social/mentors?limit=1')
      ])

      const [battlesData, collaborationsData, chainsData, mentorsData] = await Promise.all([
        battlesRes.json(),
        collaborationsRes.json(),
        chainsRes.json(),
        mentorsRes.json()
      ])

      setStats({
        battles: battlesData.success ? battlesData.data.pagination.total : 0,
        collaborations: collaborationsData.success ? collaborationsData.data.pagination.total : 0,
        chains: chainsData.success ? chainsData.data.pagination.total : 0,
        mentors: mentorsData.success ? mentorsData.data.pagination.total : 0
      })
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 relative overflow-hidden">
      {/* 传统装饰背景 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 border-4 border-red-600 rounded-full"></div>
        <div className="absolute top-20 right-20 w-24 h-24 border-2 border-red-500 rotate-45"></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 border-3 border-red-400 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-20 h-20 border-2 border-red-600 rotate-12"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* 页面标题 - 中国风设计 */}
        <div className="text-center mb-16">
          <div className="relative inline-block">
            <h1 className="text-6xl font-black text-red-700 mb-4 relative">
              社交互动
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full opacity-80"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-orange-600 rounded-full opacity-60"></div>
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
          </div>
          <p className="text-red-600 text-xl font-bold mt-8 max-w-3xl mx-auto leading-relaxed">
            参与对联PK比赛，协作创作精品，接龙游戏互动，拜师学艺精进
          </p>
          <div className="flex justify-center items-center gap-4 mt-6">
            <div className="w-16 h-0.5 bg-red-600"></div>
            <span className="text-red-700 font-bold text-lg">🏮 传承文化 🏮</span>
            <div className="w-16 h-0.5 bg-red-600"></div>
          </div>
        </div>

        {/* 功能入口卡片 - 中国风红色主题 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {/* 对联PK */}
          <Link href="/social/battles" className="group">
            <div className="relative bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-8 text-white shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-red-500 hover:border-red-400">
              <div className="absolute top-4 right-4 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-2xl">
                🏆
              </div>
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full"></div>
              
              <h3 className="text-2xl font-black mb-4 group-hover:text-yellow-200 transition-colors">
                对联PK
              </h3>
              <p className="text-red-100 mb-6 leading-relaxed">
                文人雅士齐聚，诗词对联竞技，一决高下见真章
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="text-red-200">进行中</div>
                  <div className="text-xl font-bold">{loading ? '...' : stats.battles}场</div>
                </div>
                <div className="bg-red-500 rounded-full p-3 group-hover:bg-red-400 transition-colors">
                  <span className="text-lg">⚔️</span>
                </div>
              </div>
            </div>
          </Link>

          {/* 协作创作 */}
          <Link href="/social/collaborations" className="group">
            <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-8 text-white shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-red-400 hover:border-red-300">
              <div className="absolute top-4 right-4 w-12 h-12 bg-red-400 rounded-full flex items-center justify-center text-2xl">
                👥
              </div>
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-orange-400 rounded-full"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-orange-500 rounded-full"></div>
              
              <h3 className="text-2xl font-black mb-4 group-hover:text-yellow-200 transition-colors">
                协作创作
              </h3>
              <p className="text-red-100 mb-6 leading-relaxed">
                众人拾柴火焰高，集思广益创佳联，合作共赢
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="text-red-200">活跃项目</div>
                  <div className="text-xl font-bold">{loading ? '...' : stats.collaborations}个</div>
                </div>
                <div className="bg-red-400 rounded-full p-3 group-hover:bg-red-300 transition-colors">
                  <span className="text-lg">🤝</span>
                </div>
              </div>
            </div>
          </Link>

          {/* 对联接龙 */}
          <Link href="/social/chains" className="group">
            <div className="relative bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-8 text-white shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-orange-500 hover:border-orange-400">
              <div className="absolute top-4 right-4 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-2xl">
                🔗
              </div>
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-400 rounded-full"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-red-500 rounded-full"></div>
              
              <h3 className="text-2xl font-black mb-4 group-hover:text-yellow-200 transition-colors">
                对联接龙
              </h3>
              <p className="text-orange-100 mb-6 leading-relaxed">
                诗词接龙乐无穷，上联下联巧相连，妙趣横生
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="text-orange-200">热门接龙</div>
                  <div className="text-xl font-bold">{loading ? '...' : stats.chains}条</div>
                </div>
                <div className="bg-orange-500 rounded-full p-3 group-hover:bg-orange-400 transition-colors">
                  <span className="text-lg">🎭</span>
                </div>
              </div>
            </div>
          </Link>

          {/* 导师系统 */}
          <Link href="/social/mentors" className="group">
            <div className="relative bg-gradient-to-br from-red-700 to-red-800 rounded-2xl p-8 text-white shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-red-600 hover:border-red-500">
              <div className="absolute top-4 right-4 w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-2xl">
                👨‍🏫
              </div>
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full"></div>
              
              <h3 className="text-2xl font-black mb-4 group-hover:text-yellow-200 transition-colors">
                导师系统
              </h3>
              <p className="text-red-100 mb-6 leading-relaxed">
                名师出高徒，拜师学艺道，传承文化薪火相传
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="text-red-200">在线导师</div>
                  <div className="text-xl font-bold">{loading ? '...' : stats.mentors}位</div>
                </div>
                <div className="bg-red-600 rounded-full p-3 group-hover:bg-red-500 transition-colors">
                  <span className="text-lg">📚</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* 底部装饰 - 中国风元素 */}
        <div className="text-center">
          <div className="inline-flex items-center gap-6 bg-red-600 text-white px-8 py-4 rounded-full shadow-xl">
            <span className="text-2xl">🏮</span>
            <span className="font-bold text-lg">传承千年文化，共创诗词佳话</span>
            <span className="text-2xl">🏮</span>
          </div>
        </div>
      </div>

      {/* 浮动装饰元素 */}
      <div className="absolute top-1/4 left-8 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 right-12 w-3 h-3 bg-orange-500 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute bottom-1/4 left-16 w-2 h-2 bg-red-600 rounded-full animate-pulse delay-2000"></div>
      <div className="absolute bottom-1/3 right-8 w-3 h-3 bg-red-400 rounded-full animate-pulse delay-3000"></div>
    </div>
  )
}

export default ClientSocialPage