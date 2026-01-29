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
  hourlyRate: number
  expertise: string[]
}

interface Props {
  mentorId: string
}

const ClientApplyMentorPage: React.FC<Props> = ({ mentorId }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const [mentor, setMentor] = useState<MentorInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    message: '',
    goals: '',
    experience: '',
    availability: '',
    expectations: ''
  })

  useEffect(() => {
    fetchMentorInfo()
  }, [mentorId])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.id) {
      router.push('/sign-in')
      return
    }

    if (!formData.message || !formData.goals) {
      alert('请填写申请理由和学习目标')
      return
    }

    try {
      setSubmitting(true)
      
      const response = await fetch(`/api/social/mentors/${mentorId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          studentId: session.user.id
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('申请提交成功，请等待导师回复！')
        router.push(`/social/mentors/${mentorId}`)
      } else {
        alert(data.message || '申请失败')
      }
    } catch (error) {
      console.error('申请指导失败:', error)
      alert('申请失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-red-700 mb-4">申请指导</h1>
            <p className="text-red-600 text-lg">向导师申请学习指导</p>
          </div>

          {/* 导师信息 */}
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">{mentor.avatar}</div>
              <div>
                <h2 className="text-2xl font-black text-red-700">{mentor.name}</h2>
                <p className="text-red-600 text-lg font-bold">{mentor.title}</p>
                <p className="text-gray-600">时薪: ¥{mentor.hourlyRate}/小时</p>
              </div>
            </div>
            
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="font-bold text-red-700 mb-2">专长领域:</div>
              <div className="flex flex-wrap gap-2">
                {mentor.expertise && mentor.expertise.length > 0 ? (
                  mentor.expertise.map((skill, index) => (
                    <span key={index} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">暂无专长信息</span>
                )}
              </div>
            </div>
          </div>

          {/* 申请表单 */}
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-xl font-black text-red-700 border-b-2 border-red-200 pb-2">申请信息</h2>
              
              <div>
                <label className="block text-red-700 font-bold mb-2">申请理由 *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                  placeholder="请介绍一下你为什么想要申请这位导师的指导"
                  required
                />
              </div>

              <div>
                <label className="block text-red-700 font-bold mb-2">学习目标 *</label>
                <textarea
                  name="goals"
                  value={formData.goals}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                  placeholder="描述你希望通过学习达到的目标"
                  required
                />
              </div>

              <div>
                <label className="block text-red-700 font-bold mb-2">当前水平</label>
                <textarea
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                  placeholder="简单介绍一下你目前的对联创作水平和经验"
                />
              </div>

              <div>
                <label className="block text-red-700 font-bold mb-2">可学习时间</label>
                <textarea
                  name="availability"
                  value={formData.availability}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                  placeholder="描述你的可学习时间安排"
                />
              </div>

              <div>
                <label className="block text-red-700 font-bold mb-2">学习期望</label>
                <textarea
                  name="expectations"
                  value={formData.expectations}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                  placeholder="描述你对学习过程和方式的期望"
                />
              </div>

              {/* 申请须知 */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <h3 className="font-bold text-yellow-700 mb-2">申请须知</h3>
                <div className="text-yellow-800 text-sm space-y-1">
                  <p>• 提交申请后，导师将在3-5天内回复</p>
                  <p>• 请确保提供的信息真实有效</p>
                  <p>• 学习过程中请积极配合导师的安排</p>
                  <p>• 如有收费课程，请按时支付费用</p>
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '提交中...' : '提交申请'}
                </button>
                <Link
                  href={`/social/mentors/${mentorId}`}
                  className="px-8 py-4 border-2 border-red-600 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all duration-300 text-center"
                >
                  取消
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientApplyMentorPage