'use client'

import React, { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'

interface BattleForm {
  title: string
  description: string
  theme: string
  battleType: '1v1' | 'group' | 'tournament'
  maxParticipants: number
  timeLimit: number
  votingTimeLimit: number
  rules: string
  rewards: string
  isPublic: boolean
}

const ClientCreateBattlePage: React.FC = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [form, setForm] = useState<BattleForm>({
    title: '',
    description: '',
    theme: '',
    battleType: '1v1',
    maxParticipants: 2,
    timeLimit: 3600,
    votingTimeLimit: 86400,
    rules: '',
    rewards: '',
    isPublic: true
  })

  const battleTypes = [
    { value: '1v1', label: '1对1对决', description: '两人直接对决，胜者为王', participants: 2, difficulty: '初级' },
    { value: 'group', label: '小组赛', description: '多人参与，群雄逐鹿', participants: 8, difficulty: '中级' },
    { value: 'tournament', label: '锦标赛', description: '淘汰制比赛，层层选拔', participants: 16, difficulty: '高级' }
  ]

  const timeLimits = [
    { value: 1800, label: '30分钟' },
    { value: 3600, label: '1小时' },
    { value: 7200, label: '2小时' },
    { value: 14400, label: '4小时' },
    { value: 28800, label: '8小时' },
    { value: 86400, label: '24小时' }
  ]

  const votingLimits = [
    { value: 3600, label: '1小时' },
    { value: 14400, label: '4小时' },
    { value: 43200, label: '12小时' },
    { value: 86400, label: '24小时' },
    { value: 172800, label: '48小时' },
    { value: 259200, label: '72小时' }
  ]

  const handleInputChange = (field: keyof BattleForm, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleBattleTypeChange = (type: '1v1' | 'group' | 'tournament') => {
    const selectedType = battleTypes.find(t => t.value === type)
    setForm(prev => ({
      ...prev,
      battleType: type,
      maxParticipants: selectedType?.participants || 2
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.id) {
      setError('请先登录')
      return
    }

    if (!form.title.trim()) {
      setError('请输入比赛标题')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/social/battles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          creatorId: session.user.id,
          rules: form.rules || null,
          rewards: form.rewards || null
        })
      })

      const data = await response.json()

      if (data.success) {
        router.push('/social/battles')
      } else {
        setError(data.message || '创建比赛失败')
      }
    } catch (error) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
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
            <h1 className="text-5xl font-black text-red-700 mb-4 relative">
              创建对联PK赛
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full opacity-80 flex items-center justify-center text-white text-sm font-bold">✨</div>
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
          </div>
          <p className="text-red-600 text-lg font-bold mt-6 max-w-2xl mx-auto">
            设置比赛规则，邀请文人雅士，开启一场精彩的对联较量
          </p>
        </div>

        {/* 创建表单 */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 基本信息 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
              <h2 className="text-2xl font-black text-red-700 mb-6 flex items-center gap-2">
                <span>📋</span>
                基本信息
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-red-700 font-bold mb-2">
                    比赛标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="请输入比赛标题"
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-red-700 font-bold mb-2">比赛描述</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="请描述比赛的背景、目的或特色"
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold resize-none"
                  />
                </div>

                <div>
                  <label className="block text-red-700 font-bold mb-2">比赛主题</label>
                  <input
                    type="text"
                    value={form.theme}
                    onChange={(e) => handleInputChange('theme', e.target.value)}
                    placeholder="如：春节、爱情、山水等"
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-red-700 font-bold mb-2">
                    <input
                      type="checkbox"
                      checked={form.isPublic}
                      onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                      className="mr-2"
                    />
                    公开比赛
                  </label>
                  <p className="text-sm text-gray-600">公开比赛将显示在比赛列表中，任何人都可以参加</p>
                </div>
              </div>
            </div>

            {/* 比赛类型 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
              <h2 className="text-2xl font-black text-red-700 mb-6 flex items-center gap-2">
                <span>⚔️</span>
                比赛类型
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {battleTypes.map(type => (
                  <div
                    key={type.value}
                    onClick={() => handleBattleTypeChange(type.value as any)}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      form.battleType === type.value
                        ? 'border-red-500 bg-red-50 shadow-lg scale-105'
                        : 'border-red-200 hover:border-red-400 hover:bg-red-50'
                    }`}
                  >
                    <div className="text-center">
                      <h3 className="text-lg font-black text-red-700 mb-2">{type.label}</h3>
                      <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                      <div className="flex justify-between text-xs">
                        <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">
                          {type.participants}人
                        </span>
                        <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-bold">
                          {type.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {form.battleType !== '1v1' && (
                <div className="mt-6">
                  <label className="block text-red-700 font-bold mb-2">最大参与人数</label>
                  <input
                    type="number"
                    value={form.maxParticipants}
                    onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value))}
                    min="2"
                    max="100"
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold"
                  />
                </div>
              )}
            </div>

            {/* 时间设置 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
              <h2 className="text-2xl font-black text-red-700 mb-6 flex items-center gap-2">
                <span>⏰</span>
                时间设置
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-red-700 font-bold mb-2">创作时间限制</label>
                  <select
                    value={form.timeLimit}
                    onChange={(e) => handleInputChange('timeLimit', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold"
                  >
                    {timeLimits.map(limit => (
                      <option key={limit.value} value={limit.value}>{limit.label}</option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-600 mt-1">参赛者需要在此时间内完成对联创作</p>
                </div>

                <div>
                  <label className="block text-red-700 font-bold mb-2">投票时间限制</label>
                  <select
                    value={form.votingTimeLimit}
                    onChange={(e) => handleInputChange('votingTimeLimit', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold"
                  >
                    {votingLimits.map(limit => (
                      <option key={limit.value} value={limit.value}>{limit.label}</option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-600 mt-1">观众可以在此时间内为作品投票</p>
                </div>
              </div>
            </div>

            {/* 规则和奖励 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
              <h2 className="text-2xl font-black text-red-700 mb-6 flex items-center gap-2">
                <span>📜</span>
                规则和奖励
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-red-700 font-bold mb-2">比赛规则</label>
                  <textarea
                    value={form.rules}
                    onChange={(e) => handleInputChange('rules', e.target.value)}
                    placeholder="请详细说明比赛规则，如：对联要求、评分标准、禁止事项等"
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold resize-none"
                  />
                </div>

                <div>
                  <label className="block text-red-700 font-bold mb-2">奖励设置</label>
                  <textarea
                    value={form.rewards}
                    onChange={(e) => handleInputChange('rewards', e.target.value)}
                    placeholder="请描述获胜者将获得的奖励，如：积分、称号、实物奖品等"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-100 border-2 border-red-300 rounded-xl p-4 text-red-700 font-bold text-center">
                {error}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-4 border-2 border-red-600 text-red-600 rounded-full font-bold hover:bg-red-50 transition-all duration-300"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '创建中...' : '创建比赛'}
              </button>
            </div>
          </form>
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

export default ClientCreateBattlePage