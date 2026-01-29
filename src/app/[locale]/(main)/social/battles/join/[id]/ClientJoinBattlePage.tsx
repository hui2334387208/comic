'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'

interface BattleInfo {
  id: number
  title: string
  description: string
  theme: string
  status: string
  battleType: string
  maxParticipants: number
  currentParticipants: number
  timeLeft: string
  creator: string
}

interface Props {
  battleId: string
}

const ClientJoinBattlePage: React.FC<Props> = ({ battleId }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const [battle, setBattle] = useState<BattleInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBattleInfo()
  }, [battleId])

  const fetchBattleInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/social/battles/${battleId}`)
      const data = await response.json()
      
      if (data.success) {
        setBattle(data.data)
      } else {
        setError(data.message || '获取比赛信息失败')
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

    try {
      setJoining(true)
      
      const response = await fetch(`/api/social/battles/${battleId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('成功加入比赛！')
        router.push(`/social/battles/${battleId}`)
      } else {
        alert(data.message || '加入失败')
      }
    } catch (error) {
      console.error('加入比赛失败:', error)
      alert('加入失败，请稍后重试')
    } finally {
      setJoining(false)
    }
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

  if (battle.status !== 'recruiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <div className="text-red-600 text-xl font-bold mb-4">该比赛不在招募阶段</div>
          <Link 
            href={`/social/battles/${battleId}`}
            className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700"
          >
            查看比赛详情
          </Link>
        </div>
      </div>
    )
  }

  if (battle.currentParticipants >= battle.maxParticipants) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👥</div>
          <div className="text-red-600 text-xl font-bold mb-4">比赛人数已满</div>
          <Link 
            href={`/social/battles/${battleId}`}
            className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700"
          >
            查看比赛详情
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-red-700 mb-4">参加比赛</h1>
            <p className="text-red-600 text-lg">确认参加对联PK比赛</p>
          </div>

          {/* 比赛信息 */}
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8 mb-8">
            <h2 className="text-2xl font-black text-red-700 mb-6">{battle.title}</h2>
            
            <div className="space-y-4">
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="font-bold text-red-700 mb-2">比赛描述</div>
                <div className="text-red-800">{battle.description}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-orange-600 font-bold mb-1">比赛类型</div>
                  <div className="text-orange-800 font-black">
                    {battle.battleType === '1v1' ? '1对1' : 
                     battle.battleType === 'group' ? '小组赛' : '锦标赛'}
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-red-600 font-bold mb-1">参与人数</div>
                  <div className="text-red-800 font-black">
                    {battle.currentParticipants}/{battle.maxParticipants}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <div className="font-bold text-yellow-700 mb-2">比赛主题</div>
                <div className="text-yellow-800">{battle.theme || '无特定主题'}</div>
              </div>

              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="font-bold text-red-700 mb-2">剩余时间</div>
                <div className="text-red-800 font-black text-lg">{battle.timeLeft}</div>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-600">
                <div>
                  <span className="font-bold">创建者:</span> {battle.creator}
                </div>
                <div>
                  <span className="font-bold">状态:</span> 招募中
                </div>
              </div>
            </div>
          </div>

          {/* 参赛须知 */}
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8 mb-8">
            <h3 className="text-xl font-black text-red-700 mb-4">参赛须知</h3>
            <div className="text-red-800 space-y-2 text-sm">
              <p>• 参赛后请按时提交作品，逾期将被取消资格</p>
              <p>• 作品必须原创，不得抄袭他人作品</p>
              <p>• 请遵守比赛规则，文明参赛</p>
              <p>• 比赛结果将由评委或投票决定</p>
              <p>• 参赛即表示同意作品可能被公开展示</p>
            </div>
          </div>

          {/* 确认按钮 */}
          <div className="text-center">
            <div className="flex gap-4">
              <button
                onClick={handleJoinBattle}
                disabled={joining}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? '加入中...' : '确认参加比赛'}
              </button>
              <Link
                href={`/social/battles/${battleId}`}
                className="px-8 py-4 border-2 border-red-600 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all duration-300 text-center"
              >
                取消
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientJoinBattlePage