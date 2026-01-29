'use client'

import React, { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'

interface GameStats {
  totalLevels: number
  completedLevels: number
  totalPoints: number
  currentStreak: number
  activeChallenges: number
  userActiveChallenges: number
  achievements: number
  badges: number
  hasSignedToday: boolean
}

interface Achievement {
  achievement: {
    id: number
    name: string
    description: string
    icon: string
    category: string
    rarity: string
  }
  userAchievement: {
    completedAt: string
  }
}

interface Badge {
  badge: {
    id: number
    name: string
    description: string
    icon: string
    color: string
    category: string
  }
  userBadge: {
    earnedAt: string
  }
}

interface GameData {
  summary: {
    totalPoints: number
    availablePoints: number
    level: number
    levelProgress: number
    nextLevelPoints: number
    streak: number
    longestStreak: number
    lastSigninAt: string | null
  }
  stats: GameStats
  recentAchievements: Achievement[]
  recentBadges: Badge[]
}

const ClientGamePage: React.FC = () => {
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchGameData()
  }, [])

  const fetchGameData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/game')
      const result = await response.json()
      
      if (result.success) {
        setGameData(result.data)
      } else {
        setError(result.message || '获取游戏数据失败')
      }
    } catch (error) {
      console.error('获取游戏数据失败:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🎮</div>
          <div className="text-red-600 font-bold text-xl">加载游戏数据中...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-red-600 font-bold text-xl mb-4">{error}</div>
          <button 
            onClick={fetchGameData}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  if (!gameData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <div className="text-red-600 font-bold text-xl">暂无游戏数据</div>
        </div>
      </div>
    )
  }

  const { summary, stats, recentAchievements, recentBadges } = gameData

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 relative overflow-hidden">
      {/* 中国风装饰背景 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 border-4 border-red-600 rounded-full"></div>
        <div className="absolute top-20 right-20 w-24 h-24 border-2 border-red-500 rotate-45"></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 border-3 border-red-400 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-20 h-20 border-2 border-red-600 rotate-12"></div>
        {/* 传统云纹装饰 */}
        <div className="absolute top-1/4 left-1/4 w-16 h-8 bg-red-300 rounded-full opacity-20"></div>
        <div className="absolute top-1/3 right-1/3 w-20 h-10 bg-red-400 rounded-full opacity-20"></div>
        <div className="absolute bottom-1/4 right-1/4 w-18 h-9 bg-red-500 rounded-full opacity-20"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* 页面标题 - 中国风设计 */}
        <div className="text-center mb-16">
          <div className="relative inline-block">
            <h1 className="text-6xl font-black text-red-700 mb-4 relative">
              游戏闯关
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full opacity-80"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-orange-600 rounded-full opacity-60"></div>
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
          </div>
          <p className="text-red-600 text-xl font-bold mt-8 max-w-3xl mx-auto leading-relaxed">
            闯关挑战学对联，每日签到赚积分，排行榜上争高下，限时比赛显身手
          </p>
          <div className="flex justify-center items-center gap-4 mt-6">
            <div className="w-16 h-0.5 bg-red-600"></div>
            <span className="text-red-700 font-bold text-lg">🎮 寓教于乐 🎮</span>
            <div className="w-16 h-0.5 bg-red-600"></div>
          </div>
        </div>

        {/* 用户游戏数据概览 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">🏆</div>
            <div className="text-sm text-red-200">完成关卡</div>
            <div className="text-xl font-bold">{stats.completedLevels}/{stats.totalLevels}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">💎</div>
            <div className="text-sm text-orange-200">总积分</div>
            <div className="text-xl font-bold">{summary.totalPoints.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">🔥</div>
            <div className="text-sm text-red-200">连续签到</div>
            <div className="text-xl font-bold">{summary.streak}天</div>
          </div>
          <div className="bg-gradient-to-br from-red-700 to-red-800 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-sm text-red-200">参与挑战</div>
            <div className="text-xl font-bold">{stats.userActiveChallenges}</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">🏅</div>
            <div className="text-sm text-yellow-200">获得成就</div>
            <div className="text-xl font-bold">{stats.achievements}</div>
          </div>
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">📅</div>
            <div className="text-sm text-red-200">今日签到</div>
            <div className="text-lg font-bold">{stats.hasSignedToday ? '✓' : '✗'}</div>
          </div>
        </div>

        {/* 功能入口卡片 - 中国风红色主题 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-16">
          {/* 闯关挑战 */}
          <Link href="/game/levels" className="group">
            <div className="relative bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-8 text-white shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-red-500 hover:border-red-400">
              <div className="absolute top-4 right-4 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-2xl">
                🏰
              </div>
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full"></div>
              
              <h3 className="text-2xl font-black mb-4 group-hover:text-yellow-200 transition-colors">
                闯关挑战
              </h3>
              <p className="text-red-100 mb-6 leading-relaxed">
                从易到难层层闯关，挑战不同难度的对联创作任务
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="text-red-200">进度</div>
                  <div className="text-xl font-bold">
                    {stats.totalLevels > 0 ? Math.round((stats.completedLevels / stats.totalLevels) * 100) : 0}%
                  </div>
                </div>
                <div className="bg-red-500 rounded-full p-3 group-hover:bg-red-400 transition-colors">
                  <span className="text-lg">⚔️</span>
                </div>
              </div>
            </div>
          </Link>

          {/* 每日签到 */}
          <Link href="/game/signin" className="group">
            <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-8 text-white shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-red-400 hover:border-red-300">
              <div className="absolute top-4 right-4 w-12 h-12 bg-red-400 rounded-full flex items-center justify-center text-2xl">
                📅
              </div>
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-orange-400 rounded-full"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-orange-500 rounded-full"></div>
              
              <h3 className="text-2xl font-black mb-4 group-hover:text-yellow-200 transition-colors">
                每日签到
              </h3>
              <p className="text-red-100 mb-6 leading-relaxed">
                每日签到获得积分奖励，连续签到获得额外奖励
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="text-red-200">连续天数</div>
                  <div className="text-xl font-bold">{summary.streak}天</div>
                </div>
                <div className="bg-red-400 rounded-full p-3 group-hover:bg-red-300 transition-colors">
                  <span className="text-lg">🎁</span>
                </div>
              </div>
            </div>
          </Link>

          {/* 排行榜 */}
          <Link href="/game/leaderboard" className="group">
            <div className="relative bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-8 text-white shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-orange-500 hover:border-orange-400">
              <div className="absolute top-4 right-4 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-2xl">
                🏆
              </div>
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-400 rounded-full"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-red-500 rounded-full"></div>
              
              <h3 className="text-2xl font-black mb-4 group-hover:text-yellow-200 transition-colors">
                排行榜
              </h3>
              <p className="text-orange-100 mb-6 leading-relaxed">
                多维度排行榜系统，展示创作质量和活跃度排名
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="text-orange-200">我的等级</div>
                  <div className="text-xl font-bold">Lv.{summary.level}</div>
                </div>
                <div className="bg-orange-500 rounded-full p-3 group-hover:bg-orange-400 transition-colors">
                  <span className="text-lg">🥇</span>
                </div>
              </div>
            </div>
          </Link>

          {/* 限时挑战 */}
          <Link href="/game/challenges" className="group">
            <div className="relative bg-gradient-to-br from-red-700 to-red-800 rounded-2xl p-8 text-white shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-red-600 hover:border-red-500">
              <div className="absolute top-4 right-4 w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-2xl">
                ⏰
              </div>
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full"></div>
              
              <h3 className="text-2xl font-black mb-4 group-hover:text-yellow-200 transition-colors">
                限时挑战
              </h3>
              <p className="text-red-100 mb-6 leading-relaxed">
                定期举办主题对联创作比赛，限时挑战展现实力
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="text-red-200">进行中</div>
                  <div className="text-xl font-bold">{stats.activeChallenges}场</div>
                </div>
                <div className="bg-red-600 rounded-full p-3 group-hover:bg-red-500 transition-colors">
                  <span className="text-lg">⚡</span>
                </div>
              </div>
            </div>
          </Link>

          {/* 个人档案 */}
          <Link href="/game/profile" className="group">
            <div className="relative bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-8 text-white shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-purple-500 hover:border-purple-400">
              <div className="absolute top-4 right-4 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-2xl">
                👤
              </div>
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-pink-400 rounded-full"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-pink-500 rounded-full"></div>
              
              <h3 className="text-2xl font-black mb-4 group-hover:text-yellow-200 transition-colors">
                个人档案
              </h3>
              <p className="text-purple-100 mb-6 leading-relaxed">
                查看个人游戏统计、成就进度和历史记录
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="text-purple-200">当前等级</div>
                  <div className="text-xl font-bold">Lv.{summary.level}</div>
                </div>
                <div className="bg-purple-500 rounded-full p-3 group-hover:bg-purple-400 transition-colors">
                  <span className="text-lg">📊</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* 最新活动和成就展示 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* 最新成就 */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border-4 border-red-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl">
                🏅
              </div>
              <h3 className="text-2xl font-bold text-red-700">最新成就</h3>
            </div>
            <div className="space-y-4">
              {recentAchievements.length > 0 ? (
                recentAchievements.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-500">
                    <div className="text-2xl">{item.achievement.icon || '🏅'}</div>
                    <div>
                      <div className="font-bold text-yellow-700">{item.achievement.name}</div>
                      <div className="text-yellow-600 text-sm">{item.achievement.description}</div>
                      <div className="text-yellow-500 text-xs">
                        {new Date(item.userAchievement.completedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🎯</div>
                  <div>暂无成就，继续努力吧！</div>
                </div>
              )}
            </div>
          </div>

          {/* 最新徽章 */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border-4 border-red-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl">
                🎖️
              </div>
              <h3 className="text-2xl font-bold text-red-700">最新徽章</h3>
            </div>
            <div className="space-y-4">
              {recentBadges.length > 0 ? (
                recentBadges.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                    <div className="text-2xl">{item.badge.icon || '🎖️'}</div>
                    <div>
                      <div className="font-bold text-blue-700">{item.badge.name}</div>
                      <div className="text-blue-600 text-sm">{item.badge.description}</div>
                      <div className="text-blue-500 text-xs">
                        {new Date(item.userBadge.earnedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🎖️</div>
                  <div>暂无徽章，继续加油！</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部装饰 - 中国风元素 */}
        <div className="text-center">
          <div className="inline-flex items-center gap-6 bg-red-600 text-white px-8 py-4 rounded-full shadow-xl">
            <span className="text-2xl">🎮</span>
            <span className="font-bold text-lg">寓教于乐学对联，游戏闯关展才华</span>
            <span className="text-2xl">🎮</span>
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

export default ClientGamePage