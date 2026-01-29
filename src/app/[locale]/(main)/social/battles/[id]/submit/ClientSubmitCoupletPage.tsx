'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'

interface Battle {
  id: number
  title: string
  theme: string
  status: string
  timeLimit: number
  endTime: string
}

interface CoupletForm {
  upperLine: string
  lowerLine: string
  horizontalScroll: string
  explanation: string
}

interface Props {
  battleId: string
}

const ClientSubmitCoupletPage: React.FC<Props> = ({ battleId }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const [battle, setBattle] = useState<Battle | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState('')
  
  const [form, setForm] = useState<CoupletForm>({
    upperLine: '',
    lowerLine: '',
    horizontalScroll: '',
    explanation: ''
  })

  useEffect(() => {
    fetchBattleInfo()
  }, [battleId])

  useEffect(() => {
    if (battle?.endTime) {
      const timer = setInterval(() => {
        const now = new Date().getTime()
        const end = new Date(battle.endTime).getTime()
        const diff = end - now

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)
          setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
        } else {
          setTimeLeft('时间已到')
          clearInterval(timer)
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [battle])

  const fetchBattleInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/social/battles/${battleId}`)
      const data = await response.json()
      
      if (data.success) {
        setBattle(data.data.battle)
        
        // 检查用户是否已经提交
        const userParticipant = data.data.participants?.find((p: any) => p.userId === session?.user?.id)
        if (userParticipant?.status === 'submitted') {
          router.push(`/social/battles/${battleId}`)
          return
        }
      } else {
        setError(data.message || '获取比赛信息失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CoupletForm, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateCouplet = () => {
    if (!form.upperLine.trim()) {
      setError('请输入上联')
      return false
    }
    
    if (!form.lowerLine.trim()) {
      setError('请输入下联')
      return false
    }

    // 简单的对联格式检查
    if (form.upperLine.length !== form.lowerLine.length) {
      setError('上联和下联字数应该相等')
      return false
    }

    if (form.upperLine.length < 3) {
      setError('对联至少需要3个字')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.id) {
      router.push('/sign-in')
      return
    }

    if (!validateCouplet()) {
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // 首先创建对联
      const coupletResponse = await fetch('/api/couplet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          upperLine: form.upperLine.trim(),
          lowerLine: form.lowerLine.trim(),
          horizontalScroll: form.horizontalScroll.trim() || null,
          explanation: form.explanation.trim() || null,
          theme: battle?.theme || null,
          isPublic: true,
          source: 'battle'
        })
      })

      const coupletData = await coupletResponse.json()
      
      if (!coupletData.success) {
        setError(coupletData.message || '创建对联失败')
        return
      }

      // 然后提交到比赛
      const submitResponse = await fetch(`/api/social/battles/${battleId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coupletId: coupletData.data.id
        })
      })

      const submitData = await submitResponse.json()

      if (submitData.success) {
        alert('作品提交成功！')
        router.push(`/social/battles/${battleId}`)
      } else {
        setError(submitData.message || '提交作品失败')
      }
    } catch (error) {
      setError('网络错误，请稍后重试')
    } finally {
      setSubmitting(false)
    }
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

  if (error && !battle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <div className="text-red-600 text-xl font-bold mb-4">{error}</div>
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

  if (battle?.status !== 'ongoing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏰</div>
          <div className="text-red-600 text-xl font-bold mb-4">比赛未在进行中</div>
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
              提交参赛作品
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full opacity-80 flex items-center justify-center text-white text-sm font-bold">📝</div>
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
          </div>
          <p className="text-red-600 text-lg font-bold mt-6">
            比赛: {battle?.title}
          </p>
          {battle?.theme && (
            <p className="text-orange-600 font-bold mt-2">
              主题: {battle.theme}
            </p>
          )}
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：提交表单 */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 对联创作 */}
              <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
                <h2 className="text-2xl font-black text-red-700 mb-6 flex items-center gap-2">
                  <span>✍️</span>
                  对联创作
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-red-700 font-bold mb-2">
                      上联 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.upperLine}
                      onChange={(e) => handleInputChange('upperLine', e.target.value)}
                      placeholder="请输入上联"
                      className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold text-lg text-center"
                      required
                    />
                    <div className="text-sm text-gray-600 mt-1 text-center">
                      字数: {form.upperLine.length}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="inline-block w-16 h-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-full"></div>
                  </div>

                  <div>
                    <label className="block text-red-700 font-bold mb-2">
                      下联 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.lowerLine}
                      onChange={(e) => handleInputChange('lowerLine', e.target.value)}
                      placeholder="请输入下联"
                      className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold text-lg text-center"
                      required
                    />
                    <div className="text-sm text-gray-600 mt-1 text-center">
                      字数: {form.lowerLine.length}
                    </div>
                  </div>

                  <div>
                    <label className="block text-red-700 font-bold mb-2">横批 (可选)</label>
                    <input
                      type="text"
                      value={form.horizontalScroll}
                      onChange={(e) => handleInputChange('horizontalScroll', e.target.value)}
                      placeholder="请输入横批"
                      className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold text-center"
                    />
                  </div>

                  {/* 对联预览 */}
                  {(form.upperLine || form.lowerLine) && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                      <h3 className="text-red-700 font-bold mb-4 text-center">对联预览</h3>
                      <div className="text-center space-y-3">
                        {form.horizontalScroll && (
                          <div className="text-red-600 font-bold text-lg mb-4">
                            {form.horizontalScroll}
                          </div>
                        )}
                        <div className="text-red-800 font-black text-xl">
                          {form.upperLine || '请输入上联'}
                        </div>
                        <div className="text-red-800 font-black text-xl">
                          {form.lowerLine || '请输入下联'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 创作说明 */}
              <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
                <h2 className="text-2xl font-black text-red-700 mb-6 flex items-center gap-2">
                  <span>💭</span>
                  创作说明
                </h2>
                
                <div>
                  <label className="block text-red-700 font-bold mb-2">创作思路 (可选)</label>
                  <textarea
                    value={form.explanation}
                    onChange={(e) => handleInputChange('explanation', e.target.value)}
                    placeholder="请简述您的创作思路、灵感来源或对联的寓意"
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold resize-none"
                  />
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="bg-red-100 border-2 border-red-300 rounded-xl p-4 text-red-700 font-bold text-center">
                  {error}
                </div>
              )}

              {/* 提交按钮 */}
              <div className="flex gap-4 justify-center">
                <Link
                  href={`/social/battles/${battleId}`}
                  className="px-8 py-4 border-2 border-red-600 text-red-600 rounded-full font-bold hover:bg-red-50 transition-all duration-300"
                >
                  返回比赛
                </Link>
                <button
                  type="submit"
                  disabled={submitting || !form.upperLine.trim() || !form.lowerLine.trim()}
                  className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '提交中...' : '提交作品'}
                </button>
              </div>
            </form>
          </div>

          {/* 右侧：提示信息 */}
          <div className="space-y-6">
            {/* 倒计时 */}
            {timeLeft && (
              <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6">
                <h3 className="text-xl font-black text-red-700 mb-4 flex items-center gap-2">
                  <span>⏰</span>
                  剩余时间
                </h3>
                <div className="text-center">
                  <div className="text-3xl font-black text-red-600 mb-2">
                    {timeLeft}
                  </div>
                  <div className="text-sm text-gray-600">
                    请抓紧时间完成创作
                  </div>
                </div>
              </div>
            )}

            {/* 创作提示 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6">
              <h3 className="text-xl font-black text-red-700 mb-4 flex items-center gap-2">
                <span>💡</span>
                创作提示
              </h3>
              <div className="space-y-3 text-sm">
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="font-bold text-yellow-700 mb-1">📏 字数对等</div>
                  <div className="text-yellow-600">上联和下联的字数必须相等</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="font-bold text-blue-700 mb-1">🎵 平仄协调</div>
                  <div className="text-blue-600">注意平仄搭配，读起来朗朗上口</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="font-bold text-green-700 mb-1">🎯 主题呼应</div>
                  <div className="text-green-600">围绕比赛主题进行创作</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="font-bold text-purple-700 mb-1">✨ 意境深远</div>
                  <div className="text-purple-600">追求意境美和文学性</div>
                </div>
              </div>
            </div>

            {/* 比赛信息 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6">
              <h3 className="text-xl font-black text-red-700 mb-4 flex items-center gap-2">
                <span>ℹ️</span>
                比赛信息
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">比赛标题:</span>
                  <span className="font-bold ml-2">{battle?.title}</span>
                </div>
                {battle?.theme && (
                  <div>
                    <span className="text-gray-600">比赛主题:</span>
                    <span className="font-bold ml-2">{battle.theme}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">创作时限:</span>
                  <span className="font-bold ml-2">
                    {Math.floor((battle?.timeLimit || 0) / 3600)}小时
                  </span>
                </div>
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

export default ClientSubmitCoupletPage