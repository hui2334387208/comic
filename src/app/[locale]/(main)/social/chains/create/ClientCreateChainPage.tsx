'use client'

import React, { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'

interface ChainForm {
  title: string
  description: string
  theme: string
  startLine: string
  startLineType: 'upper' | 'lower'
  chainType: 'continuous' | 'best_match'
  maxEntries: number
  timeLimit: number
  rules: string
  isPublic: boolean
}

const ClientCreateChainPage: React.FC = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [form, setForm] = useState<ChainForm>({
    title: '',
    description: '',
    theme: '',
    startLine: '',
    startLineType: 'upper',
    chainType: 'continuous',
    maxEntries: 100,
    timeLimit: 604800,
    rules: '',
    isPublic: true
  })

  const chainTypes = [
    {
      value: 'continuous',
      label: '连续接龙',
      description: '按时间顺序连续接龙，先到先得',
      icon: '🔗',
      features: ['时间优先', '快速响应', '活跃互动']
    },
    {
      value: 'best_match',
      label: '最佳匹配',
      description: '提交多个版本，投票选择最佳',
      icon: '⭐',
      features: ['质量优先', '精心创作', '投票决定']
    }
  ]

  const timeLimits = [
    { value: 86400, label: '1天' },
    { value: 259200, label: '3天' },
    { value: 604800, label: '7天' },
    { value: 1209600, label: '14天' },
    { value: 2592000, label: '30天' },
    { value: 0, label: '无限制' }
  ]

  const handleInputChange = (field: keyof ChainForm, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.id) {
      setError('请先登录')
      return
    }

    if (!form.title.trim()) {
      setError('请输入接龙标题')
      return
    }

    if (!form.startLine.trim()) {
      setError('请输入起始句')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/social/chains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          creatorId: session.user.id,
          rules: form.rules || null
        })
      })

      const data = await response.json()

      if (data.success) {
        router.push('/social/chains')
      } else {
        setError(data.message || '创建接龙失败')
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
              创建对联接龙
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full opacity-80 flex items-center justify-center text-white text-sm font-bold">🔗</div>
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
          </div>
          <p className="text-red-600 text-lg font-bold mt-6 max-w-2xl mx-auto">
            抛砖引玉，邀请众人接龙，共同创造精彩对联
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
                    接龙标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="请输入接龙标题"
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-red-700 font-bold mb-2">接龙描述</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="请描述接龙的背景、目的或期望"
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold resize-none"
                  />
                </div>

                <div>
                  <label className="block text-red-700 font-bold mb-2">接龙主题</label>
                  <input
                    type="text"
                    value={form.theme}
                    onChange={(e) => handleInputChange('theme', e.target.value)}
                    placeholder="如：春节、山水、友情等"
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
                    公开接龙
                  </label>
                  <p className="text-sm text-gray-600">公开接龙将显示在接龙列表中，任何人都可以参加</p>
                </div>
              </div>
            </div>

            {/* 起始句设置 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
              <h2 className="text-2xl font-black text-red-700 mb-6 flex items-center gap-2">
                <span>🎯</span>
                起始句设置
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-red-700 font-bold mb-2">
                    起始句 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.startLine}
                    onChange={(e) => handleInputChange('startLine', e.target.value)}
                    placeholder="请输入起始句，其他人将基于此句进行接龙"
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold text-lg text-center"
                    required
                  />
                  <div className="text-sm text-gray-600 mt-1 text-center">
                    字数: {form.startLine.length}
                  </div>
                </div>

                <div>
                  <label className="block text-red-700 font-bold mb-4">起始句类型</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      onClick={() => handleInputChange('startLineType', 'upper')}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        form.startLineType === 'upper'
                          ? 'border-red-500 bg-red-50 shadow-lg'
                          : 'border-red-200 hover:border-red-400 hover:bg-red-50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">📝</div>
                        <h3 className="font-bold text-red-700 mb-1">上联起始</h3>
                        <p className="text-sm text-gray-600">提供上联，其他人接下联</p>
                      </div>
                    </div>
                    
                    <div
                      onClick={() => handleInputChange('startLineType', 'lower')}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        form.startLineType === 'lower'
                          ? 'border-red-500 bg-red-50 shadow-lg'
                          : 'border-red-200 hover:border-red-400 hover:bg-red-50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">✍️</div>
                        <h3 className="font-bold text-red-700 mb-1">下联起始</h3>
                        <p className="text-sm text-gray-600">提供下联，其他人接上联</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 起始句预览 */}
                {form.startLine && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                    <h3 className="text-red-700 font-bold mb-4 text-center">接龙预览</h3>
                    <div className="text-center space-y-3">
                      {form.startLineType === 'upper' ? (
                        <>
                          <div className="text-red-800 font-black text-xl">
                            {form.startLine}
                          </div>
                          <div className="text-gray-400 font-black text-xl">
                            [等待接龙...]
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-gray-400 font-black text-xl">
                            [等待接龙...]
                          </div>
                          <div className="text-red-800 font-black text-xl">
                            {form.startLine}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 接龙类型 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
              <h2 className="text-2xl font-black text-red-700 mb-6 flex items-center gap-2">
                <span>🔗</span>
                接龙类型
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {chainTypes.map(type => (
                  <div
                    key={type.value}
                    onClick={() => handleInputChange('chainType', type.value)}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      form.chainType === type.value
                        ? 'border-red-500 bg-red-50 shadow-lg scale-105'
                        : 'border-red-200 hover:border-red-400 hover:bg-red-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">{type.icon}</div>
                      <h3 className="text-lg font-black text-red-700 mb-2">{type.label}</h3>
                      <p className="text-sm text-gray-600 mb-4">{type.description}</p>
                      <div className="space-y-1">
                        {type.features.map((feature, index) => (
                          <div key={index} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 接龙设置 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
              <h2 className="text-2xl font-black text-red-700 mb-6 flex items-center gap-2">
                <span>⚙️</span>
                接龙设置
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-red-700 font-bold mb-2">最大接龙数量</label>
                  <input
                    type="number"
                    value={form.maxEntries}
                    onChange={(e) => handleInputChange('maxEntries', parseInt(e.target.value))}
                    min="10"
                    max="1000"
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold"
                  />
                  <p className="text-sm text-gray-600 mt-1">达到此数量后接龙自动结束</p>
                </div>

                <div>
                  <label className="block text-red-700 font-bold mb-2">接龙时间限制</label>
                  <select
                    value={form.timeLimit}
                    onChange={(e) => handleInputChange('timeLimit', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold"
                  >
                    {timeLimits.map(limit => (
                      <option key={limit.value} value={limit.value}>{limit.label}</option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-600 mt-1">超过此时间后接龙自动结束</p>
                </div>
              </div>
            </div>

            {/* 接龙规则 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
              <h2 className="text-2xl font-black text-red-700 mb-6 flex items-center gap-2">
                <span>📜</span>
                接龙规则
              </h2>
              
              <div>
                <label className="block text-red-700 font-bold mb-2">接龙规则说明</label>
                <textarea
                  value={form.rules}
                  onChange={(e) => handleInputChange('rules', e.target.value)}
                  placeholder="请详细说明接龙规则，如：字数要求、平仄要求、主题限制等"
                  rows={6}
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
                {loading ? '创建中...' : '创建接龙'}
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

export default ClientCreateChainPage