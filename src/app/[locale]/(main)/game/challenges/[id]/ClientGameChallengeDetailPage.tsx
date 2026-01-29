'use client'

import React, { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'

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
    status: 'registered' | 'submitted' | 'judged'
    rank?: number
    score?: number
    joinedAt?: string
    submissionTime?: string
    coupletId?: number
  } | null
  leaderboard: Array<{
    rank: number
    score: number
    user: {
      id: string
      name: string
      username: string
    }
    couplet: {
      id: number
      firstLine: string
      secondLine: string
    }
    submissionTime: string
  }>
  recentSubmissions: Array<{
    user: {
      id: string
      name: string
      username: string
    }
    couplet: {
      id: number
      firstLine: string
      secondLine: string
    }
    submissionTime: string
  }>
}

interface ClientGameChallengeDetailPageProps {
  challengeId: string
}

const ClientGameChallengeDetailPage: React.FC<ClientGameChallengeDetailPageProps> = ({ challengeId }) => {
  const { data: session } = useSession()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [firstLine, setFirstLine] = useState('')
  const [secondLine, setSecondLine] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetchChallengeDetail()
  }, [challengeId])

  const fetchChallengeDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/game/challenges/${challengeId}`)
      const result = await response.json()
      
      if (result.success) {
        setChallenge(result.data)
      } else {
        setError(result.message || '获取挑战详情失败')
      }
    } catch (error) {
      console.error('获取挑战详情失败:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleParticipate = async () => {
    if (!challenge) return

    try {
      const response = await fetch(`/api/game/challenges/${challengeId}/participate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        await fetchChallengeDetail()
      } else {
        alert(result.message || '参与失败')
      }
    } catch (error) {
      console.error('参与挑战失败:', error)
      alert('网络错误，请稍后重试')
    }
  }

  const handleSubmit = async () => {
    if (!firstLine.trim() || !secondLine.trim()) {
      alert('请输入完整的对联')
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch(`/api/game/challenges/${challengeId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstLine: firstLine.trim(),
          secondLine: secondLine.trim(),
          description: description.trim(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(`提交成功！获得${result.data.score}分，奖励${result.data.participationPoints}积分`)
        setShowSubmissionForm(false)
        setFirstLine('')
        setSecondLine('')
        setDescription('')
        await fetchChallengeDetail()
      } else {
        alert(result.message || '提交失败')
      }
    } catch (error) {
      console.error('提交作品失败:', error)
      alert('网络错误，请稍后重试')
    } finally {
      setSubmitting(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⚡</div>
          <div className="text-red-600 font-bold text-xl">加载挑战详情中...</div>
        </div>
      </div>
    )
  }

  if (error || !challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-red-600 font-bold text-xl mb-4">{error || '挑战不存在'}</div>
          <Link href="/game/challenges">
            <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors">
              返回挑战列表
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
          <div className="text-red-600 font-bold text-xl mb-4">请先登录才能参与挑战</div>
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
        {/* 挑战标题 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className={`px-4 py-2 rounded-full text-white font-bold bg-gradient-to-r ${getStatusColor(challenge.status)}`}>
              {getStatusText(challenge.status)}
            </div>
            <div className={`px-3 py-1 rounded text-sm font-bold ${getDifficultyColor(challenge.difficulty)}`}>
              {getDifficultyText(challenge.difficulty)}
            </div>
          </div>
          <h1 className="text-4xl font-black text-red-700 mb-4">
            {challenge.title}
          </h1>
          <p className="text-red-600 text-lg max-w-3xl mx-auto">
            {challenge.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：挑战信息 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-red-200 mb-6">
              <h3 className="text-xl font-bold text-red-700 mb-4">挑战信息</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-red-600">主题：</span>
                  <span className="font-bold text-red-700">{challenge.theme}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">参与人数：</span>
                  <span className="font-bold text-red-700">
                    {challenge.currentParticipants}
                    {challenge.maxParticipants && `/${challenge.maxParticipants}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">剩余时间：</span>
                  <span className="font-bold text-red-700">{challenge.timeLeft || '已结束'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">结束时间：</span>
                  <span className="font-bold text-red-700 text-sm">
                    {new Date(challenge.endTime).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 奖励信息 */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-red-200 mb-6">
              <h3 className="text-xl font-bold text-red-700 mb-4">奖励设置</h3>
              
              <div className="space-y-2">
                {challenge.rewards.first && (
                  <div className="flex justify-between">
                    <span className="text-yellow-600">🥇 第一名：</span>
                    <span className="font-bold text-yellow-700">{challenge.rewards.first.points}积分</span>
                  </div>
                )}
                {challenge.rewards.second && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">🥈 第二名：</span>
                    <span className="font-bold text-gray-700">{challenge.rewards.second.points}积分</span>
                  </div>
                )}
                {challenge.rewards.third && (
                  <div className="flex justify-between">
                    <span className="text-orange-600">🥉 第三名：</span>
                    <span className="font-bold text-orange-700">{challenge.rewards.third.points}积分</span>
                  </div>
                )}
                {challenge.rewards.participation && (
                  <div className="flex justify-between">
                    <span className="text-green-600">🎁 参与奖：</span>
                    <span className="font-bold text-green-700">{challenge.rewards.participation.points}积分</span>
                  </div>
                )}
              </div>
            </div>

            {/* 挑战要求 */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-red-200">
              <h3 className="text-xl font-bold text-red-700 mb-4">挑战要求</h3>
              
              <div className="space-y-2 text-sm">
                {challenge.requirements?.minWords && (
                  <div className="text-red-600">
                    • 最少字数：{challenge.requirements.minWords}字
                  </div>
                )}
                {challenge.requirements?.maxWords && (
                  <div className="text-red-600">
                    • 最多字数：{challenge.requirements.maxWords}字
                  </div>
                )}
                {challenge.requirements?.mustInclude && (
                  <div className="text-red-600">
                    • 必须包含：{challenge.requirements.mustInclude.join('、')}
                  </div>
                )}
                {challenge.rules?.criteria && (
                  <div className="text-red-600">
                    • 评分标准：{challenge.rules.criteria.join('、')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：参与区域和排行榜 */}
          <div className="lg:col-span-2">
            {/* 参与状态 */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-red-200 mb-6">
              {challenge.status === 'upcoming' ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">⏰</div>
                  <div className="text-red-600 font-bold text-xl mb-2">挑战即将开始</div>
                  <div className="text-red-500">请耐心等待挑战开始</div>
                </div>
              ) : challenge.status === 'ended' ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🏁</div>
                  <div className="text-red-600 font-bold text-xl mb-2">挑战已结束</div>
                  <div className="text-red-500">查看下方排行榜了解最终结果</div>
                </div>
              ) : !challenge.userParticipation ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🚀</div>
                  <div className="text-red-600 font-bold text-xl mb-4">参与挑战</div>
                  <button
                    onClick={handleParticipate}
                    className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
                  >
                    立即参与
                  </button>
                </div>
              ) : challenge.userParticipation.status === 'registered' ? (
                <div>
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-4">✏️</div>
                    <div className="text-red-600 font-bold text-xl mb-2">提交作品</div>
                    <div className="text-red-500">您已报名，请提交您的对联作品</div>
                  </div>

                  {!showSubmissionForm ? (
                    <div className="text-center">
                      <button
                        onClick={() => setShowSubmissionForm(true)}
                        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors"
                      >
                        开始创作
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-red-700 font-bold mb-2">上联：</label>
                        <input
                          type="text"
                          value={firstLine}
                          onChange={(e) => setFirstLine(e.target.value)}
                          placeholder="请输入上联..."
                          className="w-full p-3 border-2 border-red-300 rounded-lg focus:border-red-500 outline-none"
                          disabled={submitting}
                        />
                      </div>
                      <div>
                        <label className="block text-red-700 font-bold mb-2">下联：</label>
                        <input
                          type="text"
                          value={secondLine}
                          onChange={(e) => setSecondLine(e.target.value)}
                          placeholder="请输入下联..."
                          className="w-full p-3 border-2 border-red-300 rounded-lg focus:border-red-500 outline-none"
                          disabled={submitting}
                        />
                      </div>
                      <div>
                        <label className="block text-red-700 font-bold mb-2">创作说明（可选）：</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="请简述您的创作思路..."
                          className="w-full h-20 p-3 border-2 border-red-300 rounded-lg focus:border-red-500 outline-none resize-none"
                          disabled={submitting}
                        />
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={handleSubmit}
                          disabled={submitting || !firstLine.trim() || !secondLine.trim()}
                          className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-bold transition-colors"
                        >
                          {submitting ? '🔄 提交中...' : '✅ 提交作品'}
                        </button>
                        <button
                          onClick={() => setShowSubmissionForm(false)}
                          disabled={submitting}
                          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-bold transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">✅</div>
                  <div className="text-green-600 font-bold text-xl mb-2">作品已提交</div>
                  <div className="text-green-500">
                    提交时间：{challenge.userParticipation.submissionTime && 
                      new Date(challenge.userParticipation.submissionTime).toLocaleString()}
                  </div>
                  {challenge.userParticipation.score && (
                    <div className="text-green-600 font-bold mt-2">
                      得分：{challenge.userParticipation.score}分
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 排行榜 */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-red-200 mb-6">
              <h3 className="text-xl font-bold text-red-700 mb-4">🏆 排行榜</h3>
              
              {challenge.leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {challenge.leaderboard.map((entry, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-red-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        entry.rank === 1 ? 'bg-yellow-500' :
                        entry.rank === 2 ? 'bg-gray-400' :
                        entry.rank === 3 ? 'bg-orange-500' : 'bg-red-500'
                      }`}>
                        {entry.rank}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-red-700">{entry.user.name}</div>
                        <div className="text-sm text-red-600">
                          {entry.couplet.firstLine} | {entry.couplet.secondLine}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-700">{entry.score}分</div>
                        <div className="text-xs text-red-500">
                          {new Date(entry.submissionTime).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🎯</div>
                  <div>暂无排行榜数据</div>
                </div>
              )}
            </div>

            {/* 最新提交 */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-red-200">
              <h3 className="text-xl font-bold text-red-700 mb-4">📝 最新提交</h3>
              
              {challenge.recentSubmissions.length > 0 ? (
                <div className="space-y-3">
                  {challenge.recentSubmissions.map((submission, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-blue-700">{submission.user.name}</div>
                        <div className="text-xs text-blue-500">
                          {new Date(submission.submissionTime).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm text-blue-600">
                        {submission.couplet.firstLine} | {submission.couplet.secondLine}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📝</div>
                  <div>暂无提交作品</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 返回按钮 */}
        <div className="text-center mt-8">
          <Link href="/game/challenges">
            <button className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-colors shadow-lg">
              ← 返回挑战列表
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ClientGameChallengeDetailPage