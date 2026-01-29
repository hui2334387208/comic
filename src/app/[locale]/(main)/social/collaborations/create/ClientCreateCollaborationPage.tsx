'use client'

import React, { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'

interface CollaborationForm {
  title: string
  description: string
  theme: string
  collaborationType: 'sequential' | 'parallel'
  maxCollaborators: number
  timeLimit: number
  totalSteps: number
  rules: string
  isPublic: boolean
}

const ClientCreateCollaborationPage: React.FC = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [form, setForm] = useState<CollaborationForm>({
    title: '',
    description: '',
    theme: '',
    collaborationType: 'sequential',
    maxCollaborators: 5,
    timeLimit: 86400,
    totalSteps: 3,
    rules: '',
    isPublic: true
  })

  const collaborationTypes = [
    {
      value: 'sequential',
      label: '顺序协作',
      description: '按步骤依次完成，先上联后下联',
      icon: '🔄',
      steps: ['上联创作', '下联创作', '横批创作']
    },
    {
      value: 'parallel',
      label: '并行协作',
      description: '同时进行多个版本，最后投票选择',
      icon: '⚡',
      steps: ['多版本创作', '讨论完善', '投票决定']
    }
  ]

  const timeLimits = [
    { value: 3600, label: '1小时' },
    { value: 14400, label: '4小时' },
    { value: 43200, label: '12小时' },
    { value: 86400, label: '24小时' },
    { value: 172800, label: '48小时' },
    { value: 604800, label: '7天' }
  ]

  const handleInputChange = (field: keyof CollaborationForm, value: any) => {
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
      setError('请输入协作标题')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/social/collaborations', {
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
        router.push('/social/collaborations')
      } else {
        setError(data.message || '创建协作失败')
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
              创建协作创作
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full opacity-80 flex items-center justify-center text-white text-sm font-bold">🤝</div>
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
          </div>
          <p className="text-red-600 text-lg font-bold mt-6 max-w-2xl mx-auto">
            邀请文友共同创作，集思广益，创造精美对联
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
                    协作标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="请输入协作标题"
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-red-700 font-bold mb-2">协作描述</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="请描述协作的目标、期望或特色"
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold resize-none"
                  />
                </div>

                <div>
                  <label className="block text-red-700 font-bold mb-2">协作主题</label>
                  <input
                    type="text"
                    value={form.theme}
                    onChange={(e) => handleInputChange('theme', e.target.value)}
                    placeholder="如：春节、友谊、山水等"
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
                    公开协作
                  </label>
                  <p className="text-sm text-gray-600">公开协作将显示在协作列表中，任何人都可以参加</p>
                </div>
              </div>
            </div>

            {/* 协作类型 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
              <h2 className="text-2xl font-black text-red-700 mb-6 flex items-center gap-2">
                <span>🤝</span>
                协作类型
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {collaborationTypes.map(type => (
                  <div
                    key={type.value}
                    onClick={() => handleInputChange('collaborationType', type.value)}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      form.collaborationType === type.value
                        ? 'border-red-500 bg-red-50 shadow-lg scale-105'
                        : 'border-red-200 hover:border-red-400 hover:bg-red-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">{type.icon}</div>
                      <h3 className="text-lg font-black text-red-700 mb-2">{type.label}</h3>
                      <p className="text-sm text-gray-600 mb-4">{type.description}</p>
                      <div className="space-y-1">
                        {type.steps.map((step, index) => (
                          <div key={index} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                            {index + 1}. {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 协作设置 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
              <h2 className="text-2xl font-black text-red-700 mb-6 flex items-center gap-2">
                <span>⚙️</span>
                协作设置
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-red-700 font-bold mb-2">最大协作者数量</label>
                  <input
                    type="number"
                    value={form.maxCollaborators}
                    onChange={(e) => handleInputChange('maxCollaborators', parseInt(e.target.value))}
                    min="2"
                    max="20"
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold"
                  />
                  <p className="text-sm text-gray-600 mt-1">建议2-10人，人数过多可能影响协作效率</p>
                </div>

                <div>
                  <label className="block text-red-700 font-bold mb-2">协作时间限制</label>
                  <select
                    value={form.timeLimit}
                    onChange={(e) => handleInputChange('timeLimit', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold"
                  >
                    {timeLimits.map(limit => (
                      <option key={limit.value} value={limit.value}>{limit.label}</option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-600 mt-1">协作者需要在此时间内完成协作</p>
                </div>

                {form.collaborationType === 'sequential' && (
                  <div>
                    <label className="block text-red-700 font-bold mb-2">协作步骤数</label>
                    <select
                      value={form.totalSteps}
                      onChange={(e) => handleInputChange('totalSteps', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold"
                    >
                      <option value={2}>2步 (上联 + 下联)</option>
                      <option value={3}>3步 (上联 + 下联 + 横批)</option>
                      <option value={4}>4步 (上联 + 下联 + 横批 + 润色)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* 协作规则 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
              <h2 className="text-2xl font-black text-red-700 mb-6 flex items-center gap-2">
                <span>📜</span>
                协作规则
              </h2>
              
              <div>
                <label className="block text-red-700 font-bold mb-2">协作规则说明</label>
                <textarea
                  value={form.rules}
                  onChange={(e) => handleInputChange('rules', e.target.value)}
                  placeholder="请详细说明协作规则，如：参与要求、创作标准、协作流程等"
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
                {loading ? '创建中...' : '创建协作'}
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

export default ClientCreateCollaborationPage