'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'

interface MentorInfo {
  id: number
  name: string
  title: string
  avatar: string
  rating: number
  hourlyRate: number
  status: string
}

interface Props {
  mentorId: string
}

const ClientMentorApplyPage: React.FC<Props> = ({ mentorId }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const [mentor, setMentor] = useState<MentorInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // 申请表单数据
  const [formData, setFormData] = useState({
    message: '',
    currentLevel: 'beginner',
    learningGoals: '',
    availableTime: '',
    expectations: '',
    previousExperience: ''
  })

  useEffect(() => {
    if (!session?.user?.id) {
      router.push('/sign-in')
      return
    }
    fetchMentorInfo()
  }, [mentorId, session])

  const fetchMentorInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/social/mentors/${mentorId}`)
      const data = await response.json()
      
      if (data.success) {
        setMentor(data.data)
      } else {
        setError(data.message || '获取导师信息失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.message.trim()) {
      alert('请填写申请理由')
      return
    }

    if (!formData.learningGoals.trim()) {
      alert('请填写学习目标')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/social/mentors/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mentorUserId: mentorId,
          message: formData.message.trim(),
          currentLevel: formData.currentLevel,
          learningGoals: formData.learningGoals.trim(),
          availableTime: formData.availableTime.trim(),
          expectations: formData.expectations.trim(),
          previousExperience: formData.previousExperience.trim()
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('申请已提交成功！导师会尽快回复您。')
        router.push(`/social/mentors/${mentorId}`)
      } else {
        alert(data.message || '申请提交失败')
      }
    } catch (error) {
      alert('网络错误，请稍后重试')
    } finally {
      setSubmitting(false)
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

  if (error || !mentor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <div className="text-red-600 text-xl font-bold mb-4">{error || '导师不存在'}</div>
          <Link 
            href="/social/mentors"
            className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700"
          >
            返回导师列表
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
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <h1 className="text-4xl font-black text-red-700 mb-4 relative">
              申请导师指导
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* 导师信息卡片 */}
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6 mb-8">
            <div className="flex items-center gap-6">
              <div className="text-6xl">{mentor.avatar}</div>
              <div>
                <h2 className="text-2xl font-black text-red-700">{mentor.name}</h2>
                <p className="text-red-600 text-lg font-bold">{mentor.title}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-yellow-600 font-bold">⭐ {mentor.rating}%</span>
                  <span className="text-green-600 font-bold">¥{mentor.hourlyRate}/小时</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    mentor.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
                  }`}>
                    {mentor.status === 'active' ? '可预约' : '繁忙中'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 申请表单 */}
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
            <h2 className="text-2xl font-black text-red-700 mb-6 flex items-center gap-2">
              <span>📝</span>
              申请信息
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 申请理由 */}
              <div>
                <label className="block text-red-700 font-bold mb-2">
                  申请理由 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="请详细说明您为什么选择这位导师，以及希望获得什么样的指导..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold resize-none"
                  required
                />
              </div>

              {/* 当前水平 */}
              <div>
                <label className="block text-red-700 font-bold mb-2">
                  当前水平
                </label>
                <select
                  value={formData.currentLevel}
                  onChange={(e) => handleInputChange('currentLevel', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold"
                >
                  <option value="beginner">初学者</option>
                  <option value="intermediate">中级</option>
                  <option value="advanced">高级</option>
                  <option value="expert">专家级</option>
                </select>
              </div>

              {/* 学习目标 */}
              <div>
                <label className="block text-red-700 font-bold mb-2">
                  学习目标 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.learningGoals}
                  onChange={(e) => handleInputChange('learningGoals', e.target.value)}
                  placeholder="请描述您的学习目标，比如想要掌握的技能、达到的水平等..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold resize-none"
                  required
                />
              </div>

              {/* 可用时间 */}
              <div>
                <label className="block text-red-700 font-bold mb-2">
                  可用时间
                </label>
                <input
                  type="text"
                  value={formData.availableTime}
                  onChange={(e) => handleInputChange('availableTime', e.target.value)}
                  placeholder="例如：周一至周五晚上7-9点，周末全天"
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold"
                />
              </div>

              {/* 学习期望 */}
              <div>
                <label className="block text-red-700 font-bold mb-2">
                  学习期望
                </label>
                <textarea
                  value={formData.expectations}
                  onChange={(e) => handleInputChange('expectations', e.target.value)}
                  placeholder="请描述您对导师指导的期望，比如教学方式、课程安排等..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold resize-none"
                />
              </div>

              {/* 以往经验 */}
              <div>
                <label className="block text-red-700 font-bold mb-2">
                  以往经验
                </label>
                <textarea
                  value={formData.previousExperience}
                  onChange={(e) => handleInputChange('previousExperience', e.target.value)}
                  placeholder="请简述您在对联创作方面的以往经验和学习背景..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none font-bold resize-none"
                />
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-4 pt-6">
                <Link
                  href={`/social/mentors/${mentorId}`}
                  className="flex-1 text-center border-2 border-red-600 text-red-600 py-4 rounded-xl font-bold hover:bg-red-50 transition-all duration-300"
                >
                  返回导师详情
                </Link>
                <button
                  type="submit"
                  disabled={submitting || !formData.message.trim() || !formData.learningGoals.trim()}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? '提交中...' : '提交申请'}
                </button>
              </div>
            </form>
          </div>

          {/* 申请须知 */}
          <div className="bg-yellow-50 border-4 border-yellow-200 rounded-2xl p-6 mt-8">
            <h3 className="text-xl font-black text-yellow-700 mb-4 flex items-center gap-2">
              <span>💡</span>
              申请须知
            </h3>
            <div className="space-y-2 text-yellow-800">
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></span>
                <span>请详细填写申请信息，这有助于导师更好地了解您的需求</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></span>
                <span>导师会在24-48小时内回复您的申请</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></span>
                <span>申请被接受后，您可以与导师协商具体的学习计划和时间安排</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></span>
                <span>请保持诚信，如实填写个人信息和学习背景</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 浮动装饰元素 */}
      <div className="absolute top-1/4 left-8 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 right-12 w-2 h-2 bg-orange-500 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute bottom-1/4 left-16 w-4 h-4 bg-red-600 rounded-full animate-pulse delay-2000"></div>
    </div>
  )
}

export default ClientMentorApplyPage