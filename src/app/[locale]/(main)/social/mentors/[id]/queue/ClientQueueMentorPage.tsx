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
  activeStudents: number
  maxStudents: number
  status: string
}

interface QueueInfo {
  position: number
  estimatedWaitTime: string
  totalInQueue: number
}

interface Props {
  mentorId: string
}

const ClientQueueMentorPage: React.FC<Props> = ({ mentorId }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const [mentor, setMentor] = useState<MentorInfo | null>(null)
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    message: '',
    urgency: 'normal',
    preferredTime: '',
    contactMethod: 'platform'
  })

  useEffect(() => {
    fetchMentorInfo()
    fetchQueueInfo()
  }, [mentorId])

  const fetchMentorInfo = async () => {
    try {
      const response = await fetch(`/api/social/mentors/${mentorId}`)
      const data = await response.json()
      
      if (data.success) {
        setMentor(data.data)
      } else {
        setError(data.message || '获取导师信息失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    }
  }

  const fetchQueueInfo = async () => {
    try {
      const response = await fetch(`/api/social/mentors/${mentorId}/queue`)
      const data = await response.json()
      
      if (data.success) {
        setQueueInfo(data.data)
      }
    } catch (err) {
      console.error('获取排队信息失败:', err)
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

    if (!formData.message) {
      alert('请填写预约说明')
      return
    }

    try {
      setJoining(true)
      
      const response = await fetch(`/api/social/mentors/${mentorId}/queue`, {
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
        alert('成功加入排队！导师有空时会联系你。')
        router.push(`/social/mentors/${mentorId}`)
      } else {
        alert(data.message || '加入排队失败')
      }
    } catch (error) {
      console.error('加入排队失败:', error)
      alert('加入排队失败，请稍后重试')
    } finally {
      setJoining(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
            <h1 className="text-4xl font-black text-red-700 mb-4">预约排队</h1>
            <p className="text-red-600 text-lg">导师繁忙中，加入排队等候指导</p>
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
            
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <div className="font-bold text-orange-700 mb-2">当前状态: 繁忙中</div>
              <div className="text-orange-800 text-sm">
                学生容量: {mentor.activeStudents}/{mentor.maxStudents} (已满)
              </div>
            </div>
          </div>

          {/* 排队信息 */}
          {queueInfo && (
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6 mb-8">
              <h3 className="text-xl font-black text-red-700 mb-4">排队信息</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-red-600 font-bold mb-1">排队人数</div>
                  <div className="text-red-800 font-black text-2xl">{queueInfo.totalInQueue}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-orange-600 font-bold mb-1">你的位置</div>
                  <div className="text-orange-800 font-black text-2xl">第{queueInfo.position}位</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-yellow-600 font-bold mb-1">预计等待</div>
                  <div className="text-yellow-800 font-black text-lg">{queueInfo.estimatedWaitTime}</div>
                </div>
              </div>
            </div>
          )}

          {/* 预约表单 */}
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-xl font-black text-red-700 border-b-2 border-red-200 pb-2">预约信息</h2>
              
              <div>
                <label className="block text-red-700 font-bold mb-2">预约说明 *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                  placeholder="请简单说明你希望得到什么样的指导"
                  required
                />
              </div>

              <div>
                <label className="block text-red-700 font-bold mb-2">紧急程度</label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                >
                  <option value="low">不急 - 可以等待较长时间</option>
                  <option value="normal">一般 - 希望尽快安排</option>
                  <option value="high">紧急 - 希望优先安排</option>
                </select>
              </div>

              <div>
                <label className="block text-red-700 font-bold mb-2">偏好时间</label>
                <input
                  type="text"
                  name="preferredTime"
                  value={formData.preferredTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                  placeholder="如：工作日晚上、周末全天等"
                />
              </div>

              <div>
                <label className="block text-red-700 font-bold mb-2">联系方式</label>
                <select
                  name="contactMethod"
                  value={formData.contactMethod}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                >
                  <option value="platform">平台内消息</option>
                  <option value="email">邮件通知</option>
                  <option value="phone">电话联系</option>
                </select>
              </div>

              {/* 排队须知 */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <h3 className="font-bold text-yellow-700 mb-2">排队须知</h3>
                <div className="text-yellow-800 text-sm space-y-1">
                  <p>• 加入排队后，导师有空位时会按顺序联系</p>
                  <p>• 紧急程度高的申请可能会被优先处理</p>
                  <p>• 请保持联系方式畅通，及时回复导师</p>
                  <p>• 如果3天内未回复导师，将自动退出排队</p>
                  <p>• 可以随时取消排队申请</p>
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={joining}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 text-white py-4 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joining ? '加入中...' : '加入排队'}
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

export default ClientQueueMentorPage