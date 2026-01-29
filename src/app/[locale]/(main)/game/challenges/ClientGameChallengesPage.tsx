'use client'

import React, { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'

interface Challenge {
  id: number
  title: string
  description: string
  theme: string
  challengeType: 'theme_creation' | 'speed_challenge' | 'quality_contest'
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  status: 'upcoming' | 'active' | 'ended' | 'cancelled'
  startTime: string
  endTime: string
  maxParticipants?: number
  currentParticipants: number
  requirements: any
  rewards: any
  rules: any
  judgeType: 'auto' | 'manual' | 'community'
  timeLeft?: string
  creator?: {
    id: string
    name: string
    username: string
  } | null
  userParticipation?: {
    status: 'not_joined' | 'registered' | 'submitted' | 'judged'
    rank?: number
    score?: number
    joinedAt?: string
    submissionTime?: string
  } | null
}

const ClientGameChallengesPage: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [participating, setParticipating] = useState<number | null>(null)

  const filters = [
    { id: 'all', name: '全部', icon: '📋' },
    { id: 'active', name: '进行中', icon: '🔥' },
    { id: 'upcoming', name: '即将开始', icon: '⏰' },
    { id: 'ended', name: '已结束', icon: '🏁' }
  ]

  useEffect(() => {
    fetchChallenges()
  }, [activeFilter])

  const fetchChallenges = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (activeFilter !== 'all') {
        params.append('status', activeFilter)
      }
      params.append('page', '1')
      params.append('limit', '20')
      
      const response = await fetch(`/api/game/challenges?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        setChallenges(result.data.challenges)
      } else {
        console.error('获取挑战数据失败:', result.message)
        setChallenges([])
      }
      setLoading(false)
    } catch (error) {
      console.error('获取挑战数据失败:', error)
      setChallenges([])
      setLoading(false)
    }
  }

  const handleParticipate = async (challengeId: number) => {
    try {
      setParticipating(challengeId)
      
      const response = await fetch(`/api/game/challenges/${challengeId}/participate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const result = await response.json()
      
      if (result.success) {
        // 更新挑战状态
        setChallenges(prev => prev.map(challenge => 
          challenge.id === challengeId 
            ? {
                ...challenge,
                currentParticipants: challenge.currentParticipants + 1,
                userParticipation: {
                  status: 'registered',
                  joinedAt: new Date().toISOString()
                }
              }
            : challenge
        ))
        alert(result.message)
      } else {
        alert(result.message || '参与失败')
      }
    } catch (error) {
      console.error('参与挑战失败:', error)
      alert('网络错误，请稍后重试')
    } finally {
      setParticipating(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'from-green-500 to-green-600'
      case 'upcoming': return 'from-blue-500 to-blue-600'
      case 'ended': return 'from-gray-500 to-gray-600'
      case 'cancelled': return 'from-red-500 to-red-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '进行中'
      case 'upcoming': return '即将开始'
      case 'ended': return '已结束'
      case 'cancelled': return '已取消'
      default: return '未知'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'hard': return 'bg-red-100 text-red-700'
      case 'expert': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '初级'
      case 'medium': return '中级'
      case 'hard': return '高级'
      case 'expert': return '专家'
      default: return '未知'
    }
  }

  const getChallengeTypeText = (type: string) => {
    switch (type) {
      case 'theme_creation': return '主题创作'
      case 'speed_challenge': return '速度挑战'
      case 'quality_contest': return '质量竞赛'
      default: return '未知类型'
    }
  }

  const getParticipationStatusText = (status: string) => {
    switch (status) {
      case 'not_joined': return '未参与'
      case 'registered': return '已报名'
      case 'submitted': return '已提交'
      case 'judged': return '已评审'
      default: return '未知'
    }
  }

  const getParticipationStatusColor = (status: string) => {
    switch (status) {
      case 'not_joined': return 'text-gray-600'
      case 'registered': return 'text-blue-600'
      case 'submitted': return 'text-orange-600'
      case 'judged': return 'text-green-600'
      default: return 'text-gray-600'
    }
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
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h1 className="text-5xl font-black text-red-700 mb-4 relative">
              限时挑战
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full opacity-80"></div>
            </h1>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
          </div>
          <p className="text-red-600 text-lg font-bold mt-6 max-w-2xl mx-auto">
            参与限时对联创作挑战，展现创作实力，赢取丰厚奖励
          </p>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                activeFilter === filter.id
                  ? 'bg-red-600 text-white shadow-lg transform scale-105'
                  : 'bg-white text-red-600 border-2 border-red-300 hover:border-red-500'
              }`}
            >
              <span className="mr-2">{filter.icon}</span>
              {filter.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔄</div>
            <div className="text-red-600 font-bold">加载挑战数据中...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="group">
                <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-red-200 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                  {/* 挑战头部 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getStatusColor(challenge.status)} text-white`}>
                          {getStatusText(challenge.status)}
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold ${getDifficultyColor(challenge.difficulty)}`}>
                          {getDifficultyText(challenge.difficulty)}
                        </div>
                        <div className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">
                          {getChallengeTypeText(challenge.challengeType)}
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-red-700 mb-2">
                        {challenge.title}
                      </h3>
                      <p className="text-red-600 text-sm leading-relaxed">
                        {challenge.description}
                      </p>
                    </div>
                  </div>

                  {/* 挑战信息 */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-red-50 rounded-lg p-3">
                      <div className="text-xs text-red-600 mb-1">主题</div>
                      <div className="font-bold text-red-700">{challenge.theme}</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <div className="text-xs text-red-600 mb-1">参与人数</div>
                      <div className="font-bold text-red-700">
                        {challenge.currentParticipants}
                        {challenge.maxParticipants && `/${challenge.maxParticipants}`}
                      </div>
                    </div>
                  </div>

                  {/* 时间信息 */}
                  <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs text-orange-600">
                          {challenge.status === 'active' ? '剩余时间' : 
                           challenge.status === 'upcoming' ? '开始倒计时' : '已结束'}
                        </div>
                        <div className="font-bold text-orange-700">
                          {challenge.timeLeft || '已结束'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-orange-600">结束时间</div>
                        <div className="font-bold text-orange-700 text-sm">
                          {new Date(challenge.endTime).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 奖励信息 */}
                  <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                    <div className="text-xs text-yellow-600 mb-2">奖励设置</div>
                    <div className="flex flex-wrap gap-2">
                      {challenge.rewards.first && (
                        <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs font-bold">
                          🥇 {challenge.rewards.first.points}积分
                        </span>
                      )}
                      {challenge.rewards.participation && (
                        <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-bold">
                          🎁 参与奖{challenge.rewards.participation.points}积分
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 用户参与状态 */}
                  {challenge.userParticipation && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-xs text-blue-600">参与状态</div>
                          <div className={`font-bold ${getParticipationStatusColor(challenge.userParticipation.status)}`}>
                            {getParticipationStatusText(challenge.userParticipation.status)}
                          </div>
                        </div>
                        {challenge.userParticipation.rank && (
                          <div className="text-right">
                            <div className="text-xs text-blue-600">排名</div>
                            <div className="font-bold text-blue-700">
                              #{challenge.userParticipation.rank}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex gap-3">
                    {challenge.status === 'active' && (
                      <>
                        {!challenge.userParticipation || challenge.userParticipation.status === 'not_joined' ? (
                          <button
                            onClick={() => handleParticipate(challenge.id)}
                            disabled={participating === challenge.id}
                            className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-bold transition-colors"
                          >
                            {participating === challenge.id ? '🔄 参与中...' : '🚀 立即参与'}
                          </button>
                        ) : challenge.userParticipation.status === 'registered' ? (
                          <Link href={`/game/challenges/${challenge.id}`} className="flex-1">
                            <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors">
                              ✏️ 提交作品
                            </button>
                          </Link>
                        ) : (
                          <Link href={`/game/challenges/${challenge.id}`} className="flex-1">
                            <button className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors">
                              👀 查看详情
                            </button>
                          </Link>
                        )}
                      </>
                    )}
                    
                    {challenge.status === 'upcoming' && (
                      <Link href={`/game/challenges/${challenge.id}`} className="flex-1">
                        <button className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold transition-colors">
                          ⏰ 预约参与
                        </button>
                      </Link>
                    )}
                    
                    {challenge.status === 'ended' && (
                      <Link href={`/game/challenges/${challenge.id}`} className="flex-1">
                        <button className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold transition-colors">
                          📊 查看结果
                        </button>
                      </Link>
                    )}

                    <Link href={`/game/challenges/${challenge.id}`}>
                      <button className="px-4 py-3 bg-white border-2 border-red-300 text-red-600 hover:border-red-500 rounded-lg font-bold transition-colors">
                        📋 详情
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 空状态 */}
        {!loading && challenges.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <div className="text-red-600 font-bold text-xl mb-2">暂无挑战</div>
            <div className="text-red-500">当前没有符合条件的挑战，请稍后再来查看</div>
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

export default ClientGameChallengesPage