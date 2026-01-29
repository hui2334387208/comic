'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'

interface Battle {
  id: number
  title: string
  description: string
  theme: string
  status: string
}

interface Participant {
  id: number
  userId: string
  userName: string
  coupletId: number
  coupletContent: any
  submissionTime: string
  score: number
  rank: number
}

interface Props {
  battleId: string
}

const ClientVotePage: React.FC<Props> = ({ battleId }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [battle, setBattle] = useState<Battle | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [voting, setVoting] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null)
  const [comment, setComment] = useState('')

  const participantParam = searchParams.get('participant')

  useEffect(() => {
    fetchBattleDetail()
    if (participantParam) {
      setSelectedParticipant(parseInt(participantParam))
    }
  }, [battleId, participantParam])

  const fetchBattleDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/social/battles/${battleId}`)
      const data = await response.json()
      
      if (data.success) {
        setBattle(data.data.battle)
        setParticipants(data.data.participants || [])
      } else {
        setError(data.message || '获取比赛详情失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (participantId: number) => {
    if (!session?.user?.id) {
      router.push('/sign-in')
      return
    }

    setVoting(true)
    try {
      const response = await fetch(`/api/social/battles/${battleId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId,
          score: 1,
          comment: comment.trim() || null
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('投票成功！')
        router.push(`/social/battles/${battleId}`)
      } else {
        alert(data.message || '投票失败')
      }
    } catch (error) {
      alert('网络错误，请稍后重试')
    } finally {
      setVoting(false)
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('zh-CN')
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <div className="text-red-600 text-xl font-bold mb-4">请先登录</div>
          <button 
            onClick={() => router.push('/sign-in')}
            className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700"
          >
            去登录
          </button>
        </div>
      </div>
    )
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

  if (battle.status !== 'voting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏰</div>
          <div className="text-red-600 text-xl font-bold mb-4">比赛未在投票阶段</div>
          <Link 
            href={`/social/battles/${battleId}`}
            className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700"
          >
            返回比赛详情
          </Link>
        </div>
      </div>
    )
  }

  const submittedParticipants = participants.filter(p => p.coupletContent)

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
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h1 className="text-4xl font-black text-red-700 mb-4 relative">
              投票评选
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full opacity-80 flex items-center justify-center text-white text-sm font-bold">🗳️</div>
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
          </div>
          <p className="text-red-600 text-lg font-bold mt-6">
            比赛: {battle.title}
          </p>
          <p className="text-orange-600 font-bold mt-2">
            请为您认为最优秀的作品投票
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {submittedParticipants.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <div className="text-red-600 text-xl font-bold">暂无参赛作品</div>
              <div className="text-gray-600 mt-2">等待参赛者提交作品</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {submittedParticipants.map((participant, index) => (
                <div 
                  key={participant.id} 
                  className={`bg-white rounded-2xl shadow-2xl border-4 transition-all duration-300 overflow-hidden ${
                    selectedParticipant === participant.id 
                      ? 'border-red-500 shadow-red-200' 
                      : 'border-red-200 hover:border-red-400'
                  }`}
                >
                  {/* 作品头部 */}
                  <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white relative">
                    <div className="absolute top-4 right-4 flex gap-2">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        #{index + 1}
                      </span>
                      {participant.rank && (
                        <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          第{participant.rank}名
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-black mb-2 pr-20">{participant.userName}</h3>
                    <p className="text-red-100 text-sm">
                      提交时间: {formatTime(participant.submissionTime)}
                    </p>
                    <p className="text-red-100 text-sm">
                      当前得分: {participant.score}分
                    </p>
                  </div>

                  {/* 对联内容 */}
                  <div className="p-8">
                    {participant.coupletContent && (
                      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
                        <div className="text-center space-y-4">
                          {participant.coupletContent.horizontalScroll && (
                            <div className="text-red-600 font-bold text-lg mb-4">
                              {participant.coupletContent.horizontalScroll}
                            </div>
                          )}
                          <div className="text-red-800 font-black text-2xl">
                            {participant.coupletContent.upperLine}
                          </div>
                          <div className="text-red-800 font-black text-2xl">
                            {participant.coupletContent.lowerLine}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 投票按钮 */}
                    <div className="text-center">
                      <button
                        onClick={() => setSelectedParticipant(participant.id)}
                        className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 ${
                          selectedParticipant === participant.id
                            ? 'bg-red-600 text-white shadow-lg'
                            : 'border-2 border-red-600 text-red-600 hover:bg-red-50'
                        }`}
                      >
                        {selectedParticipant === participant.id ? '已选择' : '选择此作品'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 投票确认区域 */}
          {selectedParticipant && (
            <div className="mt-12 bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
              <h2 className="text-2xl font-black text-red-700 mb-6 text-center flex items-center justify-center gap-2">
                <span>🗳️</span>
                确认投票
              </h2>

              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                  <div className="text-red-700 font-bold mb-2">您选择的作品</div>
                  <div className="text-red-800 font-black text-lg">
                    {submittedParticipants.find(p => p.id === selectedParticipant)?.userName}的作品
                  </div>
                </div>

                <div>
                  <label className="block text-red-700 font-bold mb-2">投票理由 (可选)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="请简述您选择这个作品的理由"
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold resize-none"
                  />
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setSelectedParticipant(null)}
                    className="px-8 py-4 border-2 border-red-600 text-red-600 rounded-full font-bold hover:bg-red-50 transition-all duration-300"
                  >
                    重新选择
                  </button>
                  <button
                    onClick={() => handleVote(selectedParticipant)}
                    disabled={voting}
                    className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {voting ? '投票中...' : '确认投票'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 返回按钮 */}
          <div className="text-center mt-12">
            <Link 
              href={`/social/battles/${battleId}`}
              className="inline-flex items-center gap-2 bg-white text-red-600 px-8 py-4 rounded-full font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-red-200 hover:border-red-400"
            >
              <span>🏮</span>
              返回比赛详情
              <span>🏮</span>
            </Link>
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

export default ClientVotePage