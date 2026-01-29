'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'

interface CollaborationInfo {
  id: number
  title: string
  description: string
  theme: string
  status: string
  maxCollaborators: number
  currentCollaborators: number
  collaborationType: string
  totalSteps: number
  creator: string
  rules: string
}

interface Props {
  collaborationId: string
}

const ClientJoinCollaborationPage: React.FC<Props> = ({ collaborationId }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const [collaboration, setCollaboration] = useState<CollaborationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    message: '',
    skills: '',
    availability: '',
    expectations: ''
  })

  useEffect(() => {
    fetchCollaborationInfo()
  }, [collaborationId])

  const fetchCollaborationInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/social/collaborations/${collaborationId}`)
      const data = await response.json()
      
      if (data.success) {
        setCollaboration(data.data)
      } else {
        setError(data.message || '获取协作信息失败')
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

    if (!formData.message) {
      alert('请填写申请理由')
      return
    }

    try {
      setJoining(true)
      
      const response = await fetch(`/api/social/collaborations/${collaborationId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: session.user.id
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('申请提交成功，请等待创建者审核！')
        router.push(`/social/collaborations/${collaborationId}`)
      } else {
        alert(data.message || '申请失败')
      }
    } catch (error) {
      console.error('加入协作失败:', error)
      alert('申请失败，请稍后重试')
    } finally {
      setJoining(false)
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

  if (error || !collaboration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <div className="text-red-600 text-xl font-bold mb-4">{error || '协作项目不存在'}</div>
          <Link 
            href="/social/collaborations"
            className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700"
          >
            返回协作列表
          </Link>
        </div>
      </div>
    )
  }

  if (collaboration.status !== 'recruiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <div className="text-red-600 text-xl font-bold mb-4">该协作项目不在招募阶段</div>
          <Link 
            href={`/social/collaborations/${collaborationId}`}
            className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700"
          >
            查看协作详情
          </Link>
        </div>
      </div>
    )
  }

  if (collaboration.currentCollaborators >= collaboration.maxCollaborators) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👥</div>
          <div className="text-red-600 text-xl font-bold mb-4">协作人数已满</div>
          <Link 
            href={`/social/collaborations/${collaborationId}`}
            className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700"
          >
            查看协作详情
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
            <h1 className="text-4xl font-black text-red-700 mb-4">加入协作</h1>
            <p className="text-red-600 text-lg">申请加入协作创作项目</p>
          </div>

          {/* 协作信息 */}
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8 mb-8">
            <h2 className="text-2xl font-black text-red-700 mb-6">{collaboration.title}</h2>
            
            <div className="space-y-4">
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="font-bold text-red-700 mb-2">项目描述</div>
                <div className="text-red-800">{collaboration.description}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-orange-600 font-bold mb-1">协作类型</div>
                  <div className="text-orange-800 font-black">
                    {collaboration.collaborationType === 'sequential' ? '顺序协作' : '并行协作'}
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-red-600 font-bold mb-1">参与人数</div>
                  <div className="text-red-800 font-black">
                    {collaboration.currentCollaborators}/{collaboration.maxCollaborators}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <div className="font-bold text-yellow-700 mb-2">创作主题</div>
                <div className="text-yellow-800">{collaboration.theme || '无特定主题'}</div>
              </div>

              {collaboration.rules && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <div className="font-bold text-red-700 mb-2">协作规则</div>
                  <div className="text-red-800 text-sm whitespace-pre-line">{collaboration.rules}</div>
                </div>
              )}

              <div className="flex justify-between items-center text-sm text-gray-600">
                <div>
                  <span className="font-bold">创建者:</span> {collaboration.creator}
                </div>
                <div>
                  <span className="font-bold">总步骤:</span> {collaboration.totalSteps}步
                </div>
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
                  placeholder="请介绍一下你为什么想要加入这个协作项目"
                  required
                />
              </div>

              <div>
                <label className="block text-red-700 font-bold mb-2">相关技能</label>
                <textarea
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                  placeholder="描述你在对联创作方面的技能和经验"
                />
              </div>

              <div>
                <label className="block text-red-700 font-bold mb-2">可参与时间</label>
                <textarea
                  name="availability"
                  value={formData.availability}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                  placeholder="描述你的可参与时间安排"
                />
              </div>

              <div>
                <label className="block text-red-700 font-bold mb-2">协作期望</label>
                <textarea
                  name="expectations"
                  value={formData.expectations}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                  placeholder="描述你对这次协作的期望和想法"
                />
              </div>

              {/* 申请须知 */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <h3 className="font-bold text-yellow-700 mb-2">申请须知</h3>
                <div className="text-yellow-800 text-sm space-y-1">
                  <p>• 提交申请后，创建者将在3-5天内回复</p>
                  <p>• 请确保提供的信息真实有效</p>
                  <p>• 协作过程中请积极参与，按时完成任务</p>
                  <p>• 请遵守协作规则，与其他成员友好合作</p>
                  <p>• 作品版权归所有参与者共同所有</p>
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={joining}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joining ? '提交中...' : '提交申请'}
                </button>
                <Link
                  href={`/social/collaborations/${collaborationId}`}
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

export default ClientJoinCollaborationPage