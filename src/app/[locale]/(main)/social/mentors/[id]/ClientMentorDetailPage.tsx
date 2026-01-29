'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'

interface MentorDetail {
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
  totalSessions: number
  completedSessions: number
  responseTime: string
  languages: string[]
  teachingStyle: string
  successRate: number
}

interface Props {
  mentorId: string
}

const ClientMentorDetailPage: React.FC<Props> = ({ mentorId }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const [mentor, setMentor] = useState<MentorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMentorDetail()
  }, [mentorId])

  const fetchMentorDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/social/mentors/${mentorId}`)
      const data = await response.json()
      
      if (data.success) {
        setMentor(data.data)
      } else {
        setError(data.message || '获取导师详情失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyMentor = async () => {
    if (!session?.user?.id) {
      router.push('/sign-in')
      return
    }

    router.push(`/social/mentors/${mentorId}/apply`)
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
        <div className="absolute bottom-20 right-20 w-28 h-28 border-2 border-red-600 rotate-12"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* 导师头部信息 */}
        <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white relative">
            <div className="absolute top-4 right-4 flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(mentor.status)} text-white`}>
                {getStatusText(mentor.status)}
              </span>
              {mentor.verificationStatus === 'verified' && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-800 text-white">
                  ✓ 已认证
                </span>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="text-8xl">{mentor.avatar}</div>
              <div className="text-center md:text-left">
                <h1 className="text-4xl font-black mb-2">{mentor.name}</h1>
                <p className="text-red-100 text-xl font-bold mb-4">{mentor.title}</p>
                <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                  <div className="flex items-center gap-2">
                    <span className={`text-3xl font-black ${getRatingColor(mentor.rating)}`}>
                      ⭐ {mentor.rating}%
                    </span>
                  </div>
                  <div className="text-red-200 font-bold">
                    {mentor.experience} 教学经验
                  </div>
                  <div className="text-red-200 font-bold">
                    成功率 {mentor.successRate}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-red-50 p-4 rounded-xl text-center">
                <div className="text-red-600 font-bold mb-1">总学生</div>
                <div className="text-red-800 font-black text-2xl">{mentor.students}</div>
              </div>
              <div className="bg-red-100 p-4 rounded-xl text-center">
                <div className="text-red-700 font-bold mb-1">活跃学生</div>
                <div className="text-red-800 font-black text-2xl">{mentor.activeStudents}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl text-center">
                <div className="text-orange-600 font-bold mb-1">时薪</div>
                <div className="text-orange-800 font-black text-2xl">¥{mentor.hourlyRate}</div>
              </div>
              <div className="bg-red-200 p-4 rounded-xl text-center">
                <div className="text-red-700 font-bold mb-1">响应时间</div>
                <div className="text-red-800 font-black text-lg">{mentor.responseTime}</div>
              </div>
            </div>

            {/* 导师简介 */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-black text-red-700 mb-4 flex items-center gap-2">
                <span>👨‍🏫</span>
                导师简介
              </h2>
              <div className="text-red-800 leading-relaxed">
                {mentor.bio}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：详细信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 专长领域 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6">
              <h2 className="text-xl font-black text-red-700 mb-4 flex items-center gap-2">
                <span>🎯</span>
                专长领域
              </h2>
              <div className="flex flex-wrap gap-3">
                {mentor.expertise && mentor.expertise.length > 0 ? (
                  mentor.expertise.map((skill, index) => (
                    <span key={index} className="bg-red-100 text-red-700 px-4 py-2 rounded-full font-bold">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">暂无专长信息</span>
                )}
              </div>
            </div>

            {/* 教学特色 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6">
              <h2 className="text-xl font-black text-red-700 mb-4 flex items-center gap-2">
                <span>✨</span>
                教学特色
              </h2>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <div className="text-purple-800 leading-relaxed">
                  {mentor.specialties}
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <div className="font-bold mb-2">教学风格:</div>
                <div className="text-gray-800">{mentor.teachingStyle}</div>
              </div>
            </div>

            {/* 主要成就 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6">
              <h2 className="text-xl font-black text-red-700 mb-4 flex items-center gap-2">
                <span>🏆</span>
                主要成就
              </h2>
              <div className="space-y-3">
                {mentor.achievements && mentor.achievements.length > 0 ? (
                  mentor.achievements.map((achievement, index) => (
                    <div key={index} className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                      <span className="text-2xl">🏅</span>
                      <div className="text-yellow-800 font-bold">{achievement}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-center py-8">暂无成就信息</div>
                )}
              </div>
            </div>

            {/* 教学统计 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6">
              <h2 className="text-xl font-black text-red-700 mb-4 flex items-center gap-2">
                <span>📊</span>
                教学统计
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-red-600 font-bold mb-1">总课程数</div>
                  <div className="text-red-800 font-black text-xl">{mentor.totalSessions}</div>
                </div>
                <div className="bg-red-100 p-4 rounded-lg text-center">
                  <div className="text-red-700 font-bold mb-1">完成课程</div>
                  <div className="text-red-800 font-black text-xl">{mentor.completedSessions}</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                  <span>课程完成率</span>
                  <span>{Math.round((mentor.completedSessions / mentor.totalSessions) * 100) || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-orange-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((mentor.completedSessions / mentor.totalSessions) * 100) || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：操作面板 */}
          <div className="space-y-6">
            {/* 预约信息 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6">
              <h3 className="text-xl font-black text-red-700 mb-4 flex items-center gap-2">
                <span>📅</span>
                预约信息
              </h3>
              
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-red-600 font-bold mb-1">可预约时间</div>
                  <div className="text-red-800 font-black">{mentor.availability}</div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-orange-600 font-bold mb-1">学生容量</div>
                  <div className="text-orange-800 font-black text-lg mb-2">
                    {mentor.activeStudents}/{mentor.maxStudents}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(mentor.activeStudents / mentor.maxStudents) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-red-600 font-bold mb-1">支持语言</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {mentor.languages && mentor.languages.length > 0 ? (
                      mentor.languages.map((lang, index) => (
                        <span key={index} className="bg-red-200 text-red-800 px-2 py-1 rounded text-sm font-bold">
                          {lang}
                        </span>
                      ))
                    ) : (
                      <span className="text-red-800 font-bold">中文</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 申请指导 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6">
              <h3 className="text-xl font-black text-red-700 mb-4 flex items-center gap-2">
                <span>🎓</span>
                申请指导
              </h3>
              
              <div className="space-y-3">
                {mentor.status === 'active' && (
                  <button
                    onClick={handleApplyMentor}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    申请成为学生
                  </button>
                )}
                
                {mentor.status === 'busy' && (
                  <div className="w-full bg-orange-100 text-orange-700 py-4 rounded-xl font-bold text-center">
                    导师繁忙中，暂不接受新学生
                  </div>
                )}
                
                {mentor.status === 'inactive' && (
                  <div className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-center">
                    导师暂停服务
                  </div>
                )}
              </div>
            </div>

            {/* 返回按钮 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6">
              <Link
                href="/social/mentors"
                className="w-full block text-center bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                返回导师列表
              </Link>
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

export default ClientMentorDetailPage