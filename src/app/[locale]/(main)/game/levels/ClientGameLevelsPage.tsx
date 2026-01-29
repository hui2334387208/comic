'use client'

import React, { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'

interface Level {
  id: number
  name: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  levelType: string
  requirements: any
  rewards: any
  orderIndex: number
  isUnlocked: boolean
  userProgress: {
    status: 'locked' | 'unlocked' | 'in_progress' | 'completed' | 'failed'
    attempts: number
    bestScore: number
    completedAt?: string
  } | null
  passingScore: number
  timeLimit: number
  maxAttempts: number
}

const ClientGameLevelsPage: React.FC = () => {
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  useEffect(() => {
    fetchLevels()
  }, [selectedDifficulty, selectedType])

  const fetchLevels = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (selectedDifficulty !== 'all') {
        params.append('difficulty', selectedDifficulty)
      }
      if (selectedType !== 'all') {
        params.append('type', selectedType)
      }
      params.append('language', 'zh')
      
      const response = await fetch(`/api/game/levels?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        setLevels(result.data)
      } else {
        console.error('获取关卡数据失败:', result.message)
        setLevels([])
      }
      setLoading(false)
    } catch (error) {
      console.error('获取关卡数据失败:', error)
      setLevels([])
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'from-green-500 to-green-600'
      case 'medium': return 'from-yellow-500 to-orange-500'
      case 'hard': return 'from-red-500 to-red-600'
      case 'expert': return 'from-purple-600 to-purple-700'
      default: return 'from-gray-500 to-gray-600'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'in_progress': return 'text-blue-600'
      case 'unlocked': return 'text-orange-600'
      case 'locked': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'in_progress': return '进行中'
      case 'unlocked': return '可挑战'
      case 'locked': return '未解锁'
      default: return '未知'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅'
      case 'in_progress': return '🔄'
      case 'unlocked': return '🔓'
      case 'locked': return '🔒'
      default: return '❓'
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
              闯关挑战
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full opacity-80"></div>
            </h1>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
          </div>
          <p className="text-red-600 text-lg font-bold mt-6 max-w-2xl mx-auto">
            从初级到专家，逐步挑战不同难度的对联创作关卡
          </p>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <div className="flex items-center gap-2">
            <span className="text-red-700 font-bold">难度：</span>
            <select 
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 rounded-lg border-2 border-red-300 focus:border-red-500 outline-none bg-white"
            >
              <option value="all">全部</option>
              <option value="easy">初级</option>
              <option value="medium">中级</option>
              <option value="hard">高级</option>
              <option value="expert">专家</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-700 font-bold">类型：</span>
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 rounded-lg border-2 border-red-300 focus:border-red-500 outline-none bg-white"
            >
              <option value="all">全部</option>
              <option value="couplet_creation">对联创作</option>
              <option value="rhyme_matching">韵律匹配</option>
              <option value="theme_challenge">主题挑战</option>
            </select>
          </div>
        </div>

        {/* 关卡列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔄</div>
            <div className="text-red-600 font-bold">加载关卡中...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {levels.map((level) => (
              <div key={level.id} className="group">
                <div className={`relative bg-white rounded-2xl p-6 shadow-xl border-4 border-red-200 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                  level.userProgress?.status === 'locked' ? 'opacity-60' : ''
                }`}>
                  {/* 难度标签 */}
                  <div className={`absolute -top-3 -right-3 px-3 py-1 rounded-full text-white text-sm font-bold bg-gradient-to-r ${getDifficultyColor(level.difficulty)}`}>
                    {getDifficultyText(level.difficulty)}
                  </div>

                  {/* 状态图标 */}
                  <div className="absolute top-4 left-4 text-2xl">
                    {getStatusIcon(level.userProgress?.status || 'locked')}
                  </div>

                  {/* 关卡信息 */}
                  <div className="mt-8">
                    <h3 className="text-xl font-black text-red-700 mb-2">
                      第{level.orderIndex}关：{level.name}
                    </h3>
                    <p className="text-red-600 text-sm mb-4 leading-relaxed">
                      {level.description}
                    </p>

                    {/* 进度信息 */}
                    {level.userProgress && level.userProgress.status !== 'locked' && (
                      <div className="mb-4 p-3 bg-red-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`font-bold ${getStatusColor(level.userProgress.status)}`}>
                            {getStatusText(level.userProgress.status)}
                          </span>
                          {level.userProgress.bestScore > 0 && (
                            <span className="text-red-700 font-bold">
                              最高分：{level.userProgress.bestScore}
                            </span>
                          )}
                        </div>
                        {level.userProgress.attempts > 0 && (
                          <div className="text-sm text-red-600">
                            已尝试：{level.userProgress.attempts}/{level.maxAttempts}次
                          </div>
                        )}
                      </div>
                    )}

                    {/* 关卡要求 */}
                    <div className="mb-4">
                      <div className="text-sm text-red-700 font-bold mb-2">关卡要求：</div>
                      <div className="text-xs text-red-600 space-y-1">
                        <div>及格分数：{level.passingScore}分</div>
                        <div>时间限制：{Math.floor(level.timeLimit / 60)}分钟</div>
                        <div>最大尝试：{level.maxAttempts}次</div>
                      </div>
                    </div>

                    {/* 奖励信息 */}
                    <div className="mb-6">
                      <div className="text-sm text-red-700 font-bold mb-2">通关奖励：</div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                          💎 {level.rewards.points}积分
                        </span>
                        {level.rewards.badge && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            🏅 {level.rewards.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 挑战按钮 */}
                    {level.userProgress?.status === 'locked' ? (
                      <button 
                        disabled
                        className="w-full py-3 bg-gray-300 text-gray-500 rounded-lg font-bold cursor-not-allowed"
                      >
                        🔒 未解锁
                      </button>
                    ) : level.userProgress?.status === 'completed' ? (
                      <Link href={`/game/levels/${level.id}`}>
                        <button className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors">
                          ✅ 重新挑战
                        </button>
                      </Link>
                    ) : (
                      <Link href={`/game/levels/${level.id}`}>
                        <button className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors">
                          {level.userProgress?.status === 'in_progress' ? '🔄 继续挑战' : '🚀 开始挑战'}
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
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

export default ClientGameLevelsPage