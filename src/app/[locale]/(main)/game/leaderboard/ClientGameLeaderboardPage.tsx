'use client'

import React, { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'

interface LeaderboardEntry {
  rank: number
  user: {
    id: string
    name: string
    username: string
    avatar?: string
  }
  score: number
  change?: number // 排名变化
  previousRank?: number
  badge?: string // 徽章
}

interface LeaderboardData {
  [key: string]: LeaderboardEntry[]
}

const ClientGameLeaderboardPage: React.FC = () => {
  const [leaderboards, setLeaderboards] = useState<LeaderboardData>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('points')
  const [activePeriod, setActivePeriod] = useState('all_time')

  const tabs = [
    { id: 'points', name: '积分排行', icon: '💎', color: 'from-yellow-500 to-orange-500' },
    { id: 'level_completion', name: '闯关排行', icon: '🏆', color: 'from-red-500 to-red-600' },
    { id: 'creation_quality', name: '创作质量', icon: '✨', color: 'from-purple-500 to-purple-600' },
    { id: 'activity', name: '活跃度', icon: '🔥', color: 'from-blue-500 to-blue-600' }
  ]

  const periods = [
    { id: 'daily', name: '今日' },
    { id: 'weekly', name: '本周' },
    { id: 'monthly', name: '本月' },
    { id: 'all_time', name: '总榜' }
  ]

  useEffect(() => {
    fetchLeaderboards()
  }, [activeTab, activePeriod])

  const fetchLeaderboards = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/game/leaderboard?type=${activeTab}&period=${activePeriod}&limit=50`)
      const result = await response.json()
      
      if (result.success) {
        setLeaderboards({
          [activeTab]: result.data.entries
        })
      } else {
        console.error('获取排行榜数据失败:', result.message)
        setLeaderboards({})
      }
      setLoading(false)
    } catch (error) {
      console.error('获取排行榜数据失败:', error)
      setLeaderboards({})
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `#${rank}`
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-yellow-600'
      case 2: return 'from-gray-400 to-gray-600'
      case 3: return 'from-orange-400 to-orange-600'
      default: return 'from-red-500 to-red-600'
    }
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return '📈'
    if (change < 0) return '📉'
    return '➖'
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getScoreUnit = (tabId: string) => {
    switch (tabId) {
      case 'points': return '积分'
      case 'level_completion': return '关卡'
      case 'creation_quality': return '赞'
      case 'activity': return '活跃度'
      default: return ''
    }
  }

  const currentData = leaderboards[activeTab] || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 relative overflow-hidden">
      {/* 中国风装饰背景 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 border-4 border-red-600 rounded-full"></div>
        <div className="absolute top-20 right-20 w-24 h-24 border-2 border-red-500 rotate-45"></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 border-3 border-red-400 rounded-full"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h1 className="text-5xl font-black text-red-700 mb-4 relative">
              排行榜
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full opacity-80"></div>
            </h1>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
          </div>
          <p className="text-red-600 text-lg font-bold mt-6 max-w-2xl mx-auto">
            多维度排行榜系统，展示各项能力排名
          </p>
        </div>

        {/* 排行榜类型选择 */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-105`
                  : 'bg-white text-red-600 border-2 border-red-300 hover:border-red-500'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* 时间周期选择 */}
        <div className="flex justify-center gap-2 mb-8">
          {periods.map((period) => (
            <button
              key={period.id}
              onClick={() => setActivePeriod(period.id)}
              className={`px-4 py-2 rounded-lg font-bold transition-all duration-300 ${
                activePeriod === period.id
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-red-600 border border-red-300 hover:border-red-500'
              }`}
            >
              {period.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔄</div>
            <div className="text-red-600 font-bold">加载排行榜数据中...</div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* 前三名特殊展示 */}
            {currentData.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {/* 第二名 */}
                <div className="order-1 md:order-1">
                  <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl p-6 text-white text-center shadow-xl transform hover:scale-105 transition-all duration-300">
                    <div className="text-4xl mb-4">🥈</div>
                    <div className="w-16 h-16 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">
                      👤
                    </div>
                    <h3 className="font-black text-lg mb-2">{currentData[1].user.name}</h3>
                    <p className="text-gray-200 text-sm mb-4">@{currentData[1].user.username}</p>
                    <div className="text-2xl font-bold">{currentData[1].score.toLocaleString()}</div>
                    <div className="text-sm text-gray-200">{getScoreUnit(activeTab)}</div>
                    {currentData[1].badge && (
                      <div className="mt-3 bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">
                        {currentData[1].badge}
                      </div>
                    )}
                  </div>
                </div>

                {/* 第一名 */}
                <div className="order-2 md:order-2">
                  <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-8 text-white text-center shadow-2xl transform hover:scale-105 transition-all duration-300 relative">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-yellow-300 rounded-full"></div>
                    <div className="text-5xl mb-4">👑</div>
                    <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
                      👤
                    </div>
                    <h3 className="font-black text-xl mb-2">{currentData[0].user.name}</h3>
                    <p className="text-yellow-200 text-sm mb-4">@{currentData[0].user.username}</p>
                    <div className="text-3xl font-bold">{currentData[0].score.toLocaleString()}</div>
                    <div className="text-sm text-yellow-200">{getScoreUnit(activeTab)}</div>
                    {currentData[0].badge && (
                      <div className="mt-3 bg-yellow-300 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
                        {currentData[0].badge}
                      </div>
                    )}
                  </div>
                </div>

                {/* 第三名 */}
                <div className="order-3 md:order-3">
                  <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-6 text-white text-center shadow-xl transform hover:scale-105 transition-all duration-300">
                    <div className="text-4xl mb-4">🥉</div>
                    <div className="w-16 h-16 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">
                      👤
                    </div>
                    <h3 className="font-black text-lg mb-2">{currentData[2].user.name}</h3>
                    <p className="text-orange-200 text-sm mb-4">@{currentData[2].user.username}</p>
                    <div className="text-2xl font-bold">{currentData[2].score.toLocaleString()}</div>
                    <div className="text-sm text-orange-200">{getScoreUnit(activeTab)}</div>
                    {currentData[2].badge && (
                      <div className="mt-3 bg-orange-300 text-orange-800 px-3 py-1 rounded-full text-xs font-bold">
                        {currentData[2].badge}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 完整排行榜 */}
            <div className="bg-white rounded-2xl shadow-xl border-4 border-red-200 overflow-hidden">
              <div className="bg-red-600 text-white p-4">
                <h3 className="text-xl font-black text-center">
                  {tabs.find(t => t.id === activeTab)?.name} - {periods.find(p => p.id === activePeriod)?.name}
                </h3>
              </div>
              <div className="divide-y divide-red-100">
                {currentData.map((entry, index) => (
                  <div key={entry.user.id} className="p-4 hover:bg-red-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* 排名 */}
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRankColor(entry.rank)} flex items-center justify-center text-white font-bold`}>
                          {entry.rank <= 3 ? getRankIcon(entry.rank) : entry.rank}
                        </div>

                        {/* 用户信息 */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-xl">
                            👤
                          </div>
                          <div>
                            <div className="font-bold text-red-700">{entry.user.name}</div>
                            <div className="text-sm text-red-600">@{entry.user.username}</div>
                          </div>
                        </div>

                        {/* 徽章 */}
                        {entry.user.name.includes('大师') && (
                          <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                            🏅 {entry.rank === 1 ? '积分王者' : entry.rank === 2 ? '积分达人' : '积分新星'}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        {/* 排名变化 */}
                        {entry.change !== undefined && (
                          <div className={`flex items-center gap-1 ${getChangeColor(entry.change)}`}>
                            <span>{getChangeIcon(entry.change)}</span>
                            <span className="text-sm font-bold">
                              {entry.change === 0 ? '持平' : Math.abs(entry.change)}
                            </span>
                          </div>
                        )}

                        {/* 分数 */}
                        <div className="text-right">
                          <div className="text-xl font-bold text-red-700">
                            {entry.score.toLocaleString()}
                          </div>
                          <div className="text-sm text-red-600">{getScoreUnit(activeTab)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 我的排名 */}
            <div className="mt-8 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 text-white">
              <div className="text-center">
                <h3 className="text-xl font-black mb-4">我的排名</h3>
                <div className="flex justify-center items-center gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold">#156</div>
                    <div className="text-red-200">当前排名</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">2,580</div>
                    <div className="text-red-200">{getScoreUnit(activeTab)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-300">+12</div>
                    <div className="text-red-200">本周上升</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 返回按钮 */}
        <div className="text-center mt-12">
          <Link href="/game">
            <button className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-colors shadow-lg">
              ← 返回游戏中心
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ClientGameLeaderboardPage