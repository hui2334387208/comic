'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'

interface Battle {
  id: number
  title: string
  description: string
  theme: string
  status: string
  battleType: string
  maxParticipants: number
  currentParticipants: number
  timeLimit: number
  votingTimeLimit: number
  startTime: string
  endTime: string
  votingStartTime: string
  votingEndTime: string
  rewards: any
  rules: any
  creator: string
  createdAt: string
  timeLeft: string
}

interface Participant {
  id: number
  userId: string
  userName: string
  coupletId: number
  coupletContent: any
  submissionTime: string
  status: string
  score: number
  rank: number
}

interface Props {
  battleId: string
}

const ClientBattleDetailPage: React.FC<Props> = ({ battleId }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const [battle, setBattle] = useState<Battle | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [userParticipant, setUserParticipant] = useState<Participant | null>(null)

  useEffect(() => {
    fetchBattleDetail()
  }, [battleId])

  const fetchBattleDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/social/battles/${battleId}`)
      const data = await response.json()
      
      if (data.success) {
        setBattle(data.data.battle)
        setParticipants(data.data.participants || [])
        
        // 查找当前用户的参与记录
        if (session?.user?.id) {
          const userPart = data.data.participants?.find((p: Participant) => p.userId === session.user.id)
          setUserParticipant(userPart || null)
        }
      } else {
        setError(data.message || '获取比赛详情失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinBattle = async () => {
    if (!session?.user?.id) {
      router.push('/sign-in')
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch(`/api/social/battles/${battleId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('成功参加比赛！')
        fetchBattleDetail()
      } else {
        alert(data.message || '参加比赛失败')
      }
    } catch (error) {
      alert('网络错误，请稍后重试')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmitCouplet = () => {
    router.push(`/social/battles/${battleId}/submit`)
  }

  const handleVote = (participantId: number) => {
    router.push(`/social/battles/${battleId}/vote?participant=${participantId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recruiting': return 'bg-blue-600'
      case 'ongoing': return 'bg-red-600'
      case 'voting': return 'bg-orange-600'
      case 'completed': return 'bg-green-600'
      default: return 'bg-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'recruiting': return '招募中'
      case 'ongoing': return '进行中'
      case 'voting': return '投票中'
      case 'completed': return '已完成'
      default: return '未知'
    }
  }

  const getDifficulty = (battleType: string) => {
    switch (battleType) {
      case '1v1': return { text: '初级', color: 'text-green-600 bg-green-100' }
      case 'group': return { text: '中级', color: 'text-orange-600 bg-orange-100' }
      case 'tournament': return { text: '高级', color: 'text-red-600 bg-red-100' }
      default: return { text: '未知', color: 'text-gray-600 bg-gray-100' }
    }
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return '未设置'
    return new Date(timeString).toLocaleString('zh-CN')
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏮</div>
          <div className="text-red-600 text-xl font-bold">加载中...</div>
        </div>
      </div>
    )
  }

  if (error || !battle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <div className="text-red-600 text-xl font-bold mb-4">{error || '比赛不存在'}</div>
          <Link 
            href="/social/battles"
            className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700"
          >
            返回比赛列表
          </Link>
        </div>
      </div>
    )
  }

  const difficulty = getDifficulty(battle.battleType)

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 relative overflow-hidden">
      {/* 传统装饰背景 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-40 h-40 border-4 border-red-600 rounded-full"></div>
        <div className="absolute top-40 right-32 w-32 h-32 border-2 border-red-500 rotate-45"></div>
        <div className="absolute bottom-32 left-32 w-36 h-36 border-3 border-red-400 rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 border-2 border-red-600 rotate-12"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* 比赛标题 */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h1 className="text-4xl font-black text-red-700 mb-4 relative">
              {battle.title}
              <div className="absolute -top-2 -right-2 flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(battle.status)} text-white`}>
                  {getStatusText(battle.status)}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${difficulty.color}`}>
                  {difficulty.text}
                </span>
              </div>
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
          </div>
          {battle.description && (
            <p className="text-red-600 text-lg font-bold mt-6 max-w-2xl mx-auto">
              {battle.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：比赛信息 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 比赛详情 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
              <h2 className="text-2xl font-black text-red-700 mb-6 flex items-center gap-2">
                <span>📋</span>
                比赛详情
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-red-600 font-bold mb-2">比赛主题</div>
                  <div className="text-red-800 font-black">{battle.theme || '无特定主题'}</div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-orange-600 font-bold mb-2">比赛类型</div>
                  <div className="text-orange-800 font-black">{battle.battleType}</div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-blue-600 font-bold mb-2">创作时限</div>
                  <div className="text-blue-800 font-black">{formatDuration(battle.timeLimit)}</div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-purple-600 font-bold mb-2">投票时限</div>
                  <div className="text-purple-800 font-black">{formatDuration(battle.votingTimeLimit)}</div>
                </div>
              </div>

              {battle.rules && (
                <div className="mt-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                  <div className="text-yellow-700 font-bold mb-2">📜 比赛规则</div>
                  <div className="text-yellow-800 whitespace-pre-wrap">{battle.rules}</div>
                </div>
              )}

              {battle.rewards && (
                <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="text-green-700 font-bold mb-2">🏆 奖励设置</div>
                  <div className="text-green-800 whitespace-pre-wrap">{battle.rewards}</div>
                </div>
              )}
            </div>

            {/* 参赛作品 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
              <h2 className="text-2xl font-black text-red-700 mb-6 flex items-center gap-2">
                <span>📝</span>
                参赛作品
              </h2>
              
              {participants.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <div className="text-red-600 text-xl font-bold">暂无参赛作品</div>
                  <div className="text-gray-600 mt-2">快来提交第一个作品吧！</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {participants.map((participant, index) => (
                    <div key={participant.id} className="border-2 border-red-100 rounded-xl p-6 hover:border-red-300 transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-black text-red-700">#{index + 1} {participant.userName}</h3>
                          <div className="text-sm text-gray-600">
                            提交时间: {formatTime(participant.submissionTime)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {participant.rank && (
                            <span className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-sm font-bold">
                              第{participant.rank}名
                            </span>
                          )}
                          <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-bold">
                            {participant.score}分
                          </span>
                        </div>
                      </div>
                      
                      {participant.coupletContent && (
                        <div className="bg-red-50 p-4 rounded-lg mb-4">
                          <div className="text-center">
                            <div className="text-red-800 font-black text-lg mb-2">
                              {participant.coupletContent.upperLine}
                            </div>
                            <div className="text-red-800 font-black text-lg mb-2">
                              {participant.coupletContent.lowerLine}
                            </div>
                            {participant.coupletContent.horizontalScroll && (
                              <div className="text-red-600 font-bold text-sm">
                                横批: {participant.coupletContent.horizontalScroll}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {battle.status === 'voting' && session?.user?.id !== participant.userId && (
                        <button
                          onClick={() => handleVote(participant.id)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                        >
                          投票支持
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：操作面板 */}
          <div className="space-y-6">
            {/* 比赛状态 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6">
              <h3 className="text-xl font-black text-red-700 mb-4 flex items-center gap-2">
                <span>⏰</span>
                比赛状态
              </h3>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`inline-block px-4 py-2 rounded-full text-white font-bold ${getStatusColor(battle.status)}`}>
                    {getStatusText(battle.status)}
                  </div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-red-600 font-bold mb-1">参与进度</div>
                  <div className="text-red-800 font-black text-lg mb-2">
                    {battle.currentParticipants}/{battle.maxParticipants}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-orange-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(battle.currentParticipants / battle.maxParticipants) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                {battle.timeLeft && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-orange-600 font-bold mb-1">剩余时间</div>
                    <div className="text-orange-800 font-black text-lg">{battle.timeLeft}</div>
                  </div>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6">
              <h3 className="text-xl font-black text-red-700 mb-4 flex items-center gap-2">
                <span>🎯</span>
                操作面板
              </h3>
              
              <div className="space-y-3">
                {battle.status === 'recruiting' && !userParticipant && (
                  <button
                    onClick={handleJoinBattle}
                    disabled={actionLoading}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50"
                  >
                    {actionLoading ? '加入中...' : '参加比赛'}
                  </button>
                )}
                
                {battle.status === 'ongoing' && userParticipant && userParticipant.status === 'joined' && (
                  <button
                    onClick={handleSubmitCouplet}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    提交作品
                  </button>
                )}
                
                {userParticipant && userParticipant.status === 'submitted' && (
                  <div className="w-full bg-green-100 text-green-700 py-3 rounded-xl font-bold text-center">
                    ✅ 已提交作品
                  </div>
                )}
                
                <Link
                  href="/social/battles"
                  className="w-full block text-center border-2 border-red-600 text-red-600 py-3 rounded-xl font-bold hover:bg-red-50 transition-all duration-300"
                >
                  返回比赛列表
                </Link>
              </div>
            </div>

            {/* 比赛信息 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6">
              <h3 className="text-xl font-black text-red-700 mb-4 flex items-center gap-2">
                <span>ℹ️</span>
                比赛信息
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">创建者:</span>
                  <span className="font-bold ml-2">{battle.creator}</span>
                </div>
                <div>
                  <span className="text-gray-600">创建时间:</span>
                  <span className="font-bold ml-2">{formatTime(battle.createdAt)}</span>
                </div>
                {battle.startTime && (
                  <div>
                    <span className="text-gray-600">开始时间:</span>
                    <span className="font-bold ml-2">{formatTime(battle.startTime)}</span>
                  </div>
                )}
                {battle.endTime && (
                  <div>
                    <span className="text-gray-600">结束时间:</span>
                    <span className="font-bold ml-2">{formatTime(battle.endTime)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 浮动装饰元素 */}
      <div className="absolute top-1/4 left-8 w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
      <div className="absolute top-1/3 right-12 w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-1000"></div>
      <div className="absolute bottom-1/4 left-16 w-4 h-4 bg-red-600 rounded-full animate-bounce delay-2000"></div>
      <div className="absolute bottom-1/3 right-8 w-3 h-3 bg-red-400 rounded-full animate-bounce delay-3000"></div>
    </div>
  )
}

export default ClientBattleDetailPage