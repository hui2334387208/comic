'use client'

import React, { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'

interface GameProfile {
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
  stats: {
    totalLevels: number
    completedLevels: number
    totalChallenges: number
    participatedChallenges: number
    achievements: number
    badges: number
    totalCreations: number
    totalLikes: number
  }
  achievements: Array<{
    id: number
    name: string
    description: string
    icon: string
    category: string
    rarity: string
    userProgress: {
      progress: number
      maxProgress: number
      isCompleted: boolean
      completedAt?: string
    } | null
  }>
  recentActivity: Array<{
    type: 'level_complete' | 'achievement' | 'signin' | 'challenge_participate'
    title: string
    description: string
    points?: number
    createdAt: string
  }>
}

const ClientGameProfilePage: React.FC = () => {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<GameProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (session) {
      fetchGameProfile()
    }
  }, [session])

  const fetchGameProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 获取游戏数据
      const gameResponse = await fetch('/api/game')
      const gameResult = await gameResponse.json()
      
      // 获取成就数据
      const achievementsResponse = await fetch('/api/game/achievements?type=all')
      const achievementsResult = await achievementsResponse.json()
      
      // 获取最近活动（简化处理，实际应该有专门的API）
      const recentActivity = [
        {
          type: 'signin' as const,
          title: '每日签到',
          description: '连续签到获得积分',
          points: 10,
          createdAt: new Date().toISOString(),
        }
      ]

      if (gameResult.success && achievementsResult.success) {
        setProfile({
          summary: gameResult.data.summary,
          stats: {
            ...gameResult.data.stats,
            totalChallenges: 0, // TODO: 从API获取
            participatedChallenges: gameResult.data.stats.userActiveChallenges,
            totalCreations: 0, // TODO: 从API获取
            totalLikes: 0, // TODO: 从API获取
          },
          achievements: achievementsResult.data.achievements,
          recentActivity,
        })
      } else {
        setError('获取游戏档案失败')
      }
    } catch (error) {
      console.error('获取游戏档案失败:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50'
      case 'rare': return 'border-blue-300 bg-blue-50'
      case 'epic': return 'border-purple-300 bg-purple-50'
      case 'legendary': return 'border-yellow-300 bg-yellow-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'common': return '普通'
      case 'rare': return '稀有'
      case 'epic': return '史诗'
      case 'legendary': return '传说'
      default: return '未知'
    }
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'general': return '通用'
      case 'creation': return '创作'
      case 'social': return '社交'
      case 'challenge': return '挑战'
      case 'streak': return '连续'
      default: return '其他'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">📊</div>
          <div className="text-red-600 font-bold text-xl">加载游戏档案中...</div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-red-600 font-bold text-xl mb-4">{error || '无法加载游戏档案'}</div>
          <Link href="/game">
            <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors">
              返回游戏中心
            </button>
          </Link>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <div className="text-red-600 font-bold text-xl mb-4">请先登录查看游戏档案</div>
          <Link href="/sign-in">
            <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors">
              立即登录
            </button>
          </Link>
        </div>
      </div>
    )
  }

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
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <h1 className="text-5xl font-black text-red-700 mb-4 relative">
              游戏档案
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full opacity-80"></div>
            </h1>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
          </div>
          <p className="text-red-600 text-lg font-bold mt-6">
            {session.user?.name} 的游戏成就与统计
          </p>
        </div>

        {/* 用户等级和积分概览 */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border-4 border-red-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-black text-red-700 mb-2">Lv.{profile.summary.level}</div>
              <div className="text-red-600">当前等级</div>
              <div className="w-full bg-red-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${profile.summary.levelProgress}%` }}
                ></div>
              </div>
              <div className="text-xs text-red-500 mt-1">
                还需 {profile.summary.nextLevelPoints} 积分升级
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-orange-700 mb-2">
                {profile.summary.totalPoints.toLocaleString()}
              </div>
              <div className="text-orange-600">总积分</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-green-700 mb-2">{profile.summary.streak}</div>
              <div className="text-green-600">连续签到</div>
              <div className="text-xs text-green-500">
                最长记录：{profile.summary.longestStreak}天
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-blue-700 mb-2">
                {Math.round((profile.stats.completedLevels / profile.stats.totalLevels) * 100)}%
              </div>
              <div className="text-blue-600">关卡完成度</div>
              <div className="text-xs text-blue-500">
                {profile.stats.completedLevels}/{profile.stats.totalLevels}
              </div>
            </div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {[
            { id: 'overview', name: '总览', icon: '📊' },
            { id: 'achievements', name: '成就', icon: '🏆' },
            { id: 'activity', name: '活动', icon: '📈' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white shadow-lg transform scale-105'
                  : 'bg-white text-red-600 border-2 border-red-300 hover:border-red-500'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* 标签页内容 */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 关卡统计 */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-red-200">
              <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center">
                <span className="mr-2">🏰</span>
                关卡统计
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-red-600">总关卡：</span>
                  <span className="font-bold text-red-700">{profile.stats.totalLevels}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">已完成：</span>
                  <span className="font-bold text-green-700">{profile.stats.completedLevels}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">完成率：</span>
                  <span className="font-bold text-blue-700">
                    {Math.round((profile.stats.completedLevels / profile.stats.totalLevels) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 挑战统计 */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-red-200">
              <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center">
                <span className="mr-2">⚡</span>
                挑战统计
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-red-600">参与挑战：</span>
                  <span className="font-bold text-red-700">{profile.stats.participatedChallenges}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">获得成就：</span>
                  <span className="font-bold text-yellow-700">{profile.stats.achievements}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">获得徽章：</span>
                  <span className="font-bold text-purple-700">{profile.stats.badges}</span>
                </div>
              </div>
            </div>

            {/* 创作统计 */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-red-200">
              <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center">
                <span className="mr-2">✨</span>
                创作统计
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-red-600">创作作品：</span>
                  <span className="font-bold text-red-700">{profile.stats.totalCreations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">获得点赞：</span>
                  <span className="font-bold text-pink-700">{profile.stats.totalLikes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">签到天数：</span>
                  <span className="font-bold text-green-700">{profile.summary.streak}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div>
            {profile.achievements && profile.achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profile.achievements.map((achievement) => (
                  <div 
                    key={achievement.id} 
                    className={`rounded-2xl p-6 shadow-xl border-4 ${
                      achievement.userProgress?.isCompleted 
                        ? getRarityColor(achievement.rarity)
                        : 'border-gray-300 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">{achievement.icon}</div>
                      <h3 className="text-lg font-bold text-gray-800">{achievement.name}</h3>
                      <div className="text-sm text-gray-600 mb-2">{achievement.description}</div>
                      <div className="flex justify-center gap-2">
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                          {getCategoryText(achievement.category)}
                        </span>
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                          {getRarityText(achievement.rarity)}
                        </span>
                      </div>
                    </div>

                    {achievement.userProgress ? (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>进度</span>
                          <span>{achievement.userProgress.progress}/{achievement.userProgress.maxProgress}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${(achievement.userProgress.progress / achievement.userProgress.maxProgress) * 100}%` 
                            }}
                          ></div>
                        </div>
                        {achievement.userProgress.isCompleted && achievement.userProgress.completedAt && (
                          <div className="text-xs text-green-600 text-center">
                            ✅ {new Date(achievement.userProgress.completedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 text-sm">
                        🔒 未解锁
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 shadow-xl border-4 border-red-200 text-center">
                <div className="text-6xl mb-6">🏆</div>
                <h3 className="text-2xl font-bold text-red-700 mb-4">暂无成就数据</h3>
                <p className="text-red-600 mb-6">
                  还没有获得任何成就，快去游戏中心挑战关卡吧！
                </p>
                <button
                  onClick={fetchGameProfile}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
                >
                  🔄 刷新数据
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-red-200">
            <h3 className="text-xl font-bold text-red-700 mb-6">最近活动</h3>
            
            {profile.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {profile.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl">
                      {activity.type === 'level_complete' && '🏆'}
                      {activity.type === 'achievement' && '🎖️'}
                      {activity.type === 'signin' && '📅'}
                      {activity.type === 'challenge_participate' && '⚡'}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-red-700">{activity.title}</div>
                      <div className="text-red-600 text-sm">{activity.description}</div>
                    </div>
                    <div className="text-right">
                      {activity.points && (
                        <div className="font-bold text-orange-700">+{activity.points}分</div>
                      )}
                      <div className="text-xs text-red-500">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📈</div>
                <div>暂无活动记录</div>
              </div>
            )}
          </div>
        )}

        {/* 返回按钮 */}
        <div className="text-center mt-8">
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

export default ClientGameProfilePage