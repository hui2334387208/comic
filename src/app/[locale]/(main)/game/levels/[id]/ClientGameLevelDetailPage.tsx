'use client'

import React, { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'

interface Level {
  id: number
  name: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  levelType: string
  requirements: any
  rewards: any
  orderIndex: number
  maxAttempts: number
  timeLimit: number
  passingScore: number
  userProgress: {
    status: 'locked' | 'unlocked' | 'in_progress' | 'completed' | 'failed'
    attempts: number
    bestScore: number
    completedAt?: string
  } | null
  isUnlocked: boolean
}

interface ClientGameLevelDetailPageProps {
  levelId: string
}

const ClientGameLevelDetailPage: React.FC<ClientGameLevelDetailPageProps> = ({ levelId }) => {
  const { data: session } = useSession()
  const [level, setLevel] = useState<Level | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [challengeStarted, setChallengeStarted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [submission, setSubmission] = useState('')
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    fetchLevelDetail()
  }, [levelId])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (challengeStarted && timeLeft !== null && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            setChallengeStarted(false)
            return null
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [challengeStarted, timeLeft])

  const fetchLevelDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/game/levels/${levelId}`)
      const result = await response.json()
      
      if (result.success) {
        setLevel(result.data)
      } else {
        setError(result.message || '获取关卡详情失败')
      }
    } catch (error) {
      console.error('获取关卡详情失败:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const startChallenge = async () => {
    if (!level) return

    try {
      const response = await fetch(`/api/game/levels/${levelId}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start' }),
      })

      const result = await response.json()

      if (result.success) {
        setChallengeStarted(true)
        setTimeLeft(level.timeLimit)
        setSubmission('')
        setResult(null)
      } else {
        alert(result.message || '开始挑战失败')
      }
    } catch (error) {
      console.error('开始挑战失败:', error)
      alert('网络错误，请稍后重试')
    }
  }

  const submitChallenge = async () => {
    if (!level || !submission.trim()) {
      alert('请输入您的对联作品')
      return
    }

    try {
      setSubmitting(true)
      
      const timeSpent = level.timeLimit - (timeLeft || 0)
      
      const response = await fetch(`/api/game/levels/${levelId}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'submit',
          submissionData: {
            content: submission,
            timeSpent,
          },
          timeSpent,
        }),
      })

      const submitResult = await response.json()

      if (submitResult.success) {
        setResult(submitResult.data)
        setChallengeStarted(false)
        setTimeLeft(null)
        // 刷新关卡数据
        await fetchLevelDetail()
      } else {
        alert(submitResult.message || '提交失败')
      }
    } catch (error) {
      console.error('提交挑战失败:', error)
      alert('网络错误，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🎯</div>
          <div className="text-red-600 font-bold text-xl">加载关卡详情中...</div>
        </div>
      </div>
    )
  }

  if (error || !level) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-red-600 font-bold text-xl mb-4">{error || '关卡不存在'}</div>
          <Link href="/game/levels">
            <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors">
              返回关卡列表
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
          <div className="text-red-600 font-bold text-xl mb-4">请先登录才能进行关卡挑战</div>
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
        {/* 关卡标题 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className={`px-4 py-2 rounded-full text-white font-bold bg-gradient-to-r ${getDifficultyColor(level.difficulty)}`}>
              {getDifficultyText(level.difficulty)}
            </div>
            <h1 className="text-4xl font-black text-red-700">
              第{level.orderIndex}关：{level.name}
            </h1>
          </div>
          <p className="text-red-600 text-lg max-w-2xl mx-auto">
            {level.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：关卡信息 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-red-200 mb-6">
              <h3 className="text-xl font-bold text-red-700 mb-4">关卡信息</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-red-600">及格分数：</span>
                  <span className="font-bold text-red-700">{level.passingScore}分</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">时间限制：</span>
                  <span className="font-bold text-red-700">{Math.floor(level.timeLimit / 60)}分钟</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">最大尝试：</span>
                  <span className="font-bold text-red-700">{level.maxAttempts}次</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">奖励积分：</span>
                  <span className="font-bold text-red-700">{level.rewards?.points || 0}分</span>
                </div>
              </div>
            </div>

            {/* 用户进度 */}
            {level.userProgress && (
              <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-red-200 mb-6">
                <h3 className="text-xl font-bold text-red-700 mb-4">我的进度</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-red-600">已尝试：</span>
                    <span className="font-bold text-red-700">
                      {level.userProgress.attempts}/{level.maxAttempts}次
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">最高分：</span>
                    <span className="font-bold text-red-700">{level.userProgress.bestScore}分</span>
                  </div>
                  {level.userProgress.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-red-600">完成时间：</span>
                      <span className="font-bold text-red-700 text-sm">
                        {new Date(level.userProgress.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 关卡要求 */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-red-200">
              <h3 className="text-xl font-bold text-red-700 mb-4">关卡要求</h3>
              
              <div className="space-y-2 text-sm">
                {level.requirements?.minWords && (
                  <div className="text-red-600">
                    • 最少字数：{level.requirements.minWords}字
                  </div>
                )}
                {level.requirements?.maxWords && (
                  <div className="text-red-600">
                    • 最多字数：{level.requirements.maxWords}字
                  </div>
                )}
                {level.requirements?.theme && (
                  <div className="text-red-600">
                    • 主题：{level.requirements.theme}
                  </div>
                )}
                {level.requirements?.mustInclude && (
                  <div className="text-red-600">
                    • 必须包含：{level.requirements.mustInclude.join('、')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：挑战区域 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-red-200">
              {!level.isUnlocked ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔒</div>
                  <div className="text-red-600 font-bold text-xl mb-2">关卡未解锁</div>
                  <div className="text-red-500">请先完成前面的关卡</div>
                </div>
              ) : level.userProgress?.status === 'failed' ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">😞</div>
                  <div className="text-red-600 font-bold text-xl mb-2">挑战失败</div>
                  <div className="text-red-500">已达到最大尝试次数</div>
                </div>
              ) : !challengeStarted ? (
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-red-700 mb-6">
                    {level.userProgress?.status === 'completed' ? '重新挑战' : '开始挑战'}
                  </h3>
                  
                  {result && (
                    <div className={`mb-6 p-4 rounded-lg ${result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border-2`}>
                      <div className={`text-xl font-bold mb-2 ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                        {result.passed ? '🎉 挑战成功！' : '😔 挑战失败'}
                      </div>
                      <div className="text-sm text-gray-600">
                        得分：{result.score}分 | 最高分：{result.bestScore}分
                      </div>
                      {result.rewards && (
                        <div className="text-sm text-green-600 mt-2">
                          获得奖励：{result.rewards.points}积分
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={startChallenge}
                    disabled={(level.userProgress?.attempts ?? 0) >= level.maxAttempts}
                    className="px-8 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl font-bold text-lg transition-colors shadow-lg"
                  >
                    {level.userProgress?.status === 'completed' ? '🔄 重新挑战' : '🚀 开始挑战'}
                  </button>
                </div>
              ) : (
                <div>
                  {/* 挑战进行中 */}
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-red-700">正在挑战中...</h3>
                    <div className="text-right">
                      <div className="text-sm text-red-600">剩余时间</div>
                      <div className={`text-2xl font-bold ${timeLeft && timeLeft < 60 ? 'text-red-600' : 'text-orange-600'}`}>
                        {timeLeft ? formatTime(timeLeft) : '00:00'}
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-red-700 font-bold mb-2">
                      请创作您的对联作品：
                    </label>
                    <textarea
                      value={submission}
                      onChange={(e) => setSubmission(e.target.value)}
                      placeholder="请在此输入您的对联作品..."
                      className="w-full h-40 p-4 border-2 border-red-300 rounded-lg focus:border-red-500 outline-none resize-none"
                      disabled={submitting}
                    />
                    <div className="text-sm text-red-500 mt-2">
                      当前字数：{submission.length}
                      {level.requirements?.minWords && ` (最少${level.requirements.minWords}字)`}
                      {level.requirements?.maxWords && ` (最多${level.requirements.maxWords}字)`}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={submitChallenge}
                      disabled={submitting || !submission.trim()}
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-bold transition-colors"
                    >
                      {submitting ? '🔄 提交中...' : '✅ 提交作品'}
                    </button>
                    <button
                      onClick={() => {
                        setChallengeStarted(false)
                        setTimeLeft(null)
                        setSubmission('')
                      }}
                      disabled={submitting}
                      className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-bold transition-colors"
                    >
                      放弃挑战
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 返回按钮 */}
        <div className="text-center mt-8">
          <Link href="/game/levels">
            <button className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-colors shadow-lg">
              ← 返回关卡列表
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ClientGameLevelDetailPage