'use client'

import React, { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'

interface MentorForm {
  title: string
  bio: string
  expertise: string[]
  experience: string
  achievements: string[]
  maxStudents: number
  hourlyRate: number
  availability: string
}

const ClientBecomeMentorPage: React.FC = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [form, setForm] = useState<MentorForm>({
    title: '',
    bio: '',
    expertise: [],
    experience: '',
    achievements: [],
    maxStudents: 10,
    hourlyRate: 0,
    availability: ''
  })

  const [newExpertise, setNewExpertise] = useState('')
  const [newAchievement, setNewAchievement] = useState('')

  const expertiseOptions = [
    '对联创作', '诗词鉴赏', '古典文学', '现代诗歌', '文学理论',
    '书法艺术', '国学经典', '文言文', '修辞技巧', '韵律平仄'
  ]

  const handleInputChange = (field: keyof MentorForm, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addExpertise = (expertise: string) => {
    if (expertise && !form.expertise.includes(expertise)) {
      setForm(prev => ({
        ...prev,
        expertise: [...prev.expertise, expertise]
      }))
    }
    setNewExpertise('')
  }

  const removeExpertise = (expertise: string) => {
    setForm(prev => ({
      ...prev,
      expertise: prev.expertise.filter(e => e !== expertise)
    }))
  }

  const addAchievement = () => {
    if (newAchievement.trim() && !form.achievements.includes(newAchievement.trim())) {
      setForm(prev => ({
        ...prev,
        achievements: [...prev.achievements, newAchievement.trim()]
      }))
      setNewAchievement('')
    }
  }

  const removeAchievement = (achievement: string) => {
    setForm(prev => ({
      ...prev,
      achievements: prev.achievements.filter(a => a !== achievement)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.id) {
      setError('请先登录')
      return
    }

    if (!form.title.trim()) {
      setError('请输入导师头衔')
      return
    }

    if (!form.bio.trim()) {
      setError('请输入个人简介')
      return
    }

    if (form.expertise.length === 0) {
      setError('请至少选择一个专长领域')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/social/mentors/become', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          userId: session.user.id
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('申请提交成功！我们将在3-5个工作日内审核您的申请。')
        router.push('/social/mentors')
      } else {
        setError(data.message || '申请提交失败')
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
              申请成为导师
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full opacity-80 flex items-center justify-center text-white text-sm font-bold">🎓</div>
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
          </div>
          <p className="text-red-600 text-lg font-bold mt-6 max-w-2xl mx-auto">
            分享您的知识与经验，指导后学，传承文化精髓
          </p>
        </div>

        {/* 申请表单 */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 基本信息 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
              <h2 className="text-2xl font-black text-red-700 mb-6 flex items-center gap-2">
                <span>👤</span>
                基本信息
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-red-700 font-bold mb-2">
                    导师头衔 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="如：对联创作导师、诗词鉴赏专家等"
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-red-700 font-bold mb-2">
                    个人简介 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="请简要介绍您的教学理念、个人背景和教学风格"
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold resize-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 专业能力 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
              <h2 className="text-2xl font-black text-red-700 mb-6 flex items-center gap-2">
                <span>🎯</span>
                专业能力
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-red-700 font-bold mb-2">
                    专长领域 <span className="text-red-500">*</span>
                  </label>
                  
                  {/* 已选择的专长 */}
                  {form.expertise.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {form.expertise.map(exp => (
                        <span
                          key={exp}
                          className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2"
                        >
                          {exp}
                          <button
                            type="button"
                            onClick={() => removeExpertise(exp)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* 预设选项 */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    {expertiseOptions.map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => addExpertise(option)}
                        disabled={form.expertise.includes(option)}
                        className={`px-3 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                          form.expertise.includes(option)
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-red-50 text-red-700 hover:bg-red-100 border-2 border-red-200'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  
                  {/* 自定义输入 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newExpertise}
                      onChange={(e) => setNewExpertise(e.target.value)}
                      placeholder="输入其他专长领域"
                      className="flex-1 px-4 py-2 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => addExpertise(newExpertise)}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
                    >
                      添加
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-red-700 font-bold mb-2">教学经验</label>
                  <textarea
                    value={form.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    placeholder="请详细描述您的教学经验、教学方法和成功案例"
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 成就与荣誉 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
              <h2 className="text-2xl font-black text-red-700 mb-6 flex items-center gap-2">
                <span>🏆</span>
                成就与荣誉
              </h2>
              
              <div>
                <label className="block text-red-700 font-bold mb-2">个人成就</label>
                
                {/* 已添加的成就 */}
                {form.achievements.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {form.achievements.map((achievement, index) => (
                      <div
                        key={index}
                        className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 flex justify-between items-center"
                      >
                        <span className="text-yellow-800 font-bold">{achievement}</span>
                        <button
                          type="button"
                          onClick={() => removeAchievement(achievement)}
                          className="text-yellow-600 hover:text-yellow-800 font-bold"
                        >
                          删除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 添加成就 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    placeholder="如：获得某某文学奖、发表作品数量等"
                    className="flex-1 px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold"
                  />
                  <button
                    type="button"
                    onClick={addAchievement}
                    className="px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
                  >
                    添加成就
                  </button>
                </div>
              </div>
            </div>

            {/* 教学设置 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
              <h2 className="text-2xl font-black text-red-700 mb-6 flex items-center gap-2">
                <span>⚙️</span>
                教学设置
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-red-700 font-bold mb-2">最大学生数量</label>
                  <input
                    type="number"
                    value={form.maxStudents}
                    onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value))}
                    min="1"
                    max="50"
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold"
                  />
                  <p className="text-sm text-gray-600 mt-1">您希望同时指导的最大学生数量</p>
                </div>

                <div>
                  <label className="block text-red-700 font-bold mb-2">课时费用 (元/小时)</label>
                  <input
                    type="number"
                    value={form.hourlyRate}
                    onChange={(e) => handleInputChange('hourlyRate', parseInt(e.target.value))}
                    min="0"
                    className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold"
                  />
                  <p className="text-sm text-gray-600 mt-1">设置为0表示免费指导</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-red-700 font-bold mb-2">可用时间</label>
                  <textarea
                    value={form.availability}
                    onChange={(e) => handleInputChange('availability', e.target.value)}
                    placeholder="请描述您的可用时间，如：周一至周五晚上7-9点，周末全天等"
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
                {loading ? '提交中...' : '提交申请'}
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

export default ClientBecomeMentorPage