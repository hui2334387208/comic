'use client'

import React, { useState, useEffect } from 'react'
import { Link, useRouter } from '@/i18n/navigation'

interface Mentor {
  id: number
  name: string
  title: string
  avatar: string
  rating: number
  students: number
  activeStudents: number
  maxStudents: number
  experience: string
  status: string
  expertise: string[]
  achievements: string[]
  bio: string
  hourlyRate: number
  availability: string
  verificationStatus: string
  specialties: string
}

const ClientMentorsPage: React.FC = () => {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState('all')
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMentors()
  }, [activeFilter])

  const fetchMentors = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeFilter !== 'all') {
        params.append('status', activeFilter)
      }
      
      const response = await fetch(`/api/social/mentors?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setMentors(data.data.mentors)
      } else {
        setError(data.message || '获取数据失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyMentor = async (mentorId: number) => {
    router.push(`/social/mentors/${mentorId}/apply`)
  }

  const handleQueueMentor = (mentorId: number) => {
    // 跳转到预约排队页面
    router.push(`/social/mentors/${mentorId}/queue`)
  }

  const handleViewMentorDetails = (mentorId: number) => {
    // 跳转到导师详情页面
    router.push(`/social/mentors/${mentorId}`)
  }

  const handleBecomeMentor = () => {
    // 跳转到申请成为导师页面
    router.push('/social/mentors/become')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-600'
      case 'busy': return 'bg-orange-600'
      case 'inactive': return 'bg-gray-600'
      default: return 'bg-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '可预约'
      case 'busy': return '繁忙中'
      case 'inactive': return '暂停服务'
      default: return '未知'
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 95) return 'text-red-600'
    if (rating >= 90) return 'text-orange-600'
    if (rating >= 85) return 'text-yellow-600'
    return 'text-gray-600'
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <div className="text-red-600 text-xl font-bold mb-4">{error}</div>
          <button 
            onClick={fetchMentors}
            className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700"
          >
            重试
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
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h1 className="text-5xl font-black text-red-700 mb-4 relative">
              导师系统
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full opacity-80 flex items-center justify-center text-white text-sm font-bold">📚</div>
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
          </div>
          <p className="text-red-600 text-lg font-bold mt-6 max-w-2xl mx-auto">
            名师出高徒，拜师学艺道，传承文化薪火相传
          </p>
        </div>

        {/* 操作栏 */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          {/* 筛选按钮 */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: '全部导师', icon: '👥' },
              { key: 'active', label: '可预约', icon: '✅' },
              { key: 'busy', label: '繁忙中', icon: '⏰' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 py-2 rounded-full font-bold transition-all duration-300 ${
                  activeFilter === filter.key
                    ? 'bg-red-600 text-white shadow-lg scale-105'
                    : 'bg-white text-red-600 border-2 border-red-600 hover:bg-red-50'
                }`}
              >
                <span className="mr-2">{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>

          {/* 申请成为导师按钮 */}
          <button 
            onClick={handleBecomeMentor}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-full font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-red-500"
          >
            <span className="mr-2">🎓</span>
            申请成为导师
          </button>
        </div>

        {/* 导师列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {mentors.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <div className="text-red-600 text-xl font-bold">暂无导师</div>
              <div className="text-gray-600 mt-2">快来申请成为第一位导师吧！</div>
            </div>
          ) : (
            mentors.map(mentor => (
              <div key={mentor.id} className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 hover:border-red-400 transform hover:scale-105 transition-all duration-300 overflow-hidden">
                {/* 卡片头部 */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white relative">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(mentor.status)} text-white`}>
                      {getStatusText(mentor.status)}
                    </span>
                    {mentor.verificationStatus === 'verified' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
                        ✓ 已认证
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-6xl">{mentor.avatar}</div>
                    <div>
                      <h3 className="text-2xl font-black">{mentor.name}</h3>
                      <p className="text-red-100 text-lg font-bold">{mentor.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-2xl font-black ${getRatingColor(mentor.rating)}`}>
                          ⭐ {mentor.rating}%
                        </span>
                        <span className="text-red-200 text-sm">
                          {mentor.experience} 教学经验
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 卡片内容 */}
                <div className="p-6 space-y-4">
                  {/* 导师简介 */}
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <div className="text-red-700 text-sm leading-relaxed">
                      {mentor.bio}
                    </div>
                  </div>

                  {/* 学生统计 */}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-red-50 p-3 rounded-lg text-center">
                      <div className="text-red-600 font-bold mb-1">总学生</div>
                      <div className="text-red-800 font-black text-lg">{mentor.students}</div>
                    </div>
                    <div className="bg-red-100 p-3 rounded-lg text-center">
                      <div className="text-red-700 font-bold mb-1">活跃学生</div>
                      <div className="text-red-800 font-black text-lg">{mentor.activeStudents}</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg text-center">
                      <div className="text-orange-600 font-bold mb-1">时薪</div>
                      <div className="text-orange-800 font-black text-lg">¥{mentor.hourlyRate}</div>
                    </div>
                  </div>

                  {/* 专长领域 */}
                  <div className="space-y-2">
                    <div className="font-bold text-gray-700 text-sm">专长领域</div>
                    <div className="flex flex-wrap gap-2">
                      {mentor.expertise && mentor.expertise.length > 0 ? (
                        mentor.expertise.map((skill, index) => (
                          <span key={index} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">暂无专长信息</span>
                      )}
                    </div>
                  </div>

                  {/* 成就展示 */}
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🏆</span>
                      <span className="font-bold text-yellow-700">主要成就</span>
                    </div>
                    <div className="space-y-1">
                      {mentor.achievements && mentor.achievements.length > 0 ? (
                        mentor.achievements.map((achievement, index) => (
                          <div key={index} className="text-yellow-800 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                            {achievement}
                          </div>
                        ))
                      ) : (
                        <div className="text-yellow-800 text-sm">暂无成就信息</div>
                      )}
                    </div>
                  </div>

                  {/* 教学特色 */}
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">✨</span>
                      <span className="font-bold text-red-700">教学特色</span>
                    </div>
                    <div className="text-red-800 text-sm">
                      {mentor.specialties}
                    </div>
                  </div>

                  {/* 可预约时间 */}
                  <div className="flex justify-between items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <div>
                      <span className="font-bold">可预约时间:</span>
                    </div>
                    <div className="font-bold text-gray-800">
                      {mentor.availability}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-3 pt-4">
                    {mentor.status === 'active' && (
                      <button 
                        onClick={() => handleApplyMentor(mentor.id)}
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                      >
                        申请指导
                      </button>
                    )}
                    {mentor.status === 'busy' && (
                      <button 
                        onClick={() => handleQueueMentor(mentor.id)}
                        className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                      >
                        预约排队
                      </button>
                    )}
                    <button 
                      onClick={() => handleViewMentorDetails(mentor.id)}
                      className="px-6 py-3 border-2 border-red-600 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all duration-300"
                    >
                      详情
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 返回按钮 */}
        <div className="text-center mt-12">
          <Link href="/social" className="inline-flex items-center gap-2 bg-white text-red-600 px-8 py-4 rounded-full font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-red-200 hover:border-red-400">
            <span>🏮</span>
            返回社交首页
            <span>🏮</span>
          </Link>
        </div>
      </div>

      {/* 浮动装饰元素 */}
      <div className="absolute top-1/4 left-8 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 right-12 w-2 h-2 bg-orange-500 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute bottom-1/4 left-16 w-4 h-4 bg-red-600 rounded-full animate-pulse delay-2000"></div>
    </div>
  )
}

export default ClientMentorsPage