'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'

interface Participant {
  id: number
  user: string
  role: string
  contribution: string
  contributionType: string
  step: number
  status: string
  joinedAt: string
}

interface CollaborationDetail {
  id: number
  title: string
  description: string
  theme: string
  status: string
  maxCollaborators: number
  currentCollaborators: number
  collaborationType: string
  progress: number
  currentStep: number
  totalSteps: number
  currentStepDesc: string
  creator: string
  participants: Participant[]
  rules: string
}

interface Props {
  collaborationId: string
}

const ClientCollaborationDetailPage: React.FC<Props> = ({ collaborationId }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const [collaboration, setCollaboration] = useState<CollaborationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCollaborationDetail()
  }, [collaborationId])

  const fetchCollaborationDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/social/collaborations/${collaborationId}`)
      const data = await response.json()
      
      if (data.success) {
        setCollaboration(data.data)
      } else {
        setError(data.message || '获取协作详情失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinCollaboration = () => {
    router.push(`/social/collaborations/join/${collaborationId}`)
  }

  const handleParticipateCollaboration = () => {
    router.push(`/social/collaborations/${collaborationId}/create`)
  }

  const handleFinalizeCollaboration = () => {
    router.push(`/social/collaborations/${collaborationId}/finalize`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recruiting': return 'bg-red-600'
      case 'ongoing': return 'bg-red-700'
      case 'finalizing': return 'bg-orange-600'
      case 'completed': return 'bg-red-800'
      default: return 'bg-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'recruiting': return '招募中'
      case 'ongoing': return '进行中'
      case 'finalizing': return '完善中'
      case 'completed': return '已完成'
      default: return '未知'
    }
  }

  const getStepName = (step: number) => {
    const stepNames = ['准备阶段', '上联创作', '下联创作', '横批创作', '完善润色']
    return stepNames[step - 1] || `第${step}步`
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50">
      <div className="container mx-auto px-4 py-12">
        {/* 协作头部信息 */}
        <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-4xl font-black mb-4">{collaboration.title}</h1>
                <p className="text-red-100 text-lg mb-4">{collaboration.description}</p>
              </div>
              <span className={`px-4 py-2 rounded-full font-bold text-white ${getStatusColor(collaboration.status)}`}>
                {getStatusText(collaboration.status)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-red-200">创建者: {collaboration.creator}</span>
              <span className="text-red-200">主题: {collaboration.theme || '无'}</span>
              <span className="text-red-200">类型: {collaboration.collaborationType === 'sequential' ? '顺序协作' : '并行协作'}</span>
            </div>
          </div>
          
          <div className="p-8">
            {/* 协作统计 */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-red-600 font-bold mb-1">协作者</div>
                <div className="text-red-800 font-black text-2xl">
                  {collaboration.currentCollaborators}/{collaboration.maxCollaborators}
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-orange-600 font-bold mb-1">完成度</div>
                <div className="text-orange-800 font-black text-2xl">{collaboration.progress}%</div>
              </div>
              <div className="bg-red-100 p-4 rounded-lg text-center">
                <div className="text-red-700 font-bold mb-1">当前步骤</div>
                <div className="text-red-800 font-black text-lg">{collaboration.currentStepDesc}</div>
              </div>
            </div>

            {/* 进度条 */}
            <div className="mb-8">
              <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                <span>创作进度</span>
                <span>{collaboration.currentStep}/{collaboration.totalSteps}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-red-500 to-orange-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${collaboration.progress}%` }}
                ></div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-4 mb-8">
              {collaboration.status === 'recruiting' && (
                <button 
                  onClick={handleJoinCollaboration}
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  加入协作
                </button>
              )}
              {collaboration.status === 'ongoing' && (
                <button 
                  onClick={handleParticipateCollaboration}
                  className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  参与创作
                </button>
              )}
              {collaboration.status === 'finalizing' && (
                <button 
                  onClick={handleFinalizeCollaboration}
                  className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  完善作品
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：协作流程 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 创作步骤 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6">
              <h2 className="text-xl font-black text-red-700 mb-4">创作步骤</h2>
              <div className="space-y-4">
                {Array.from({ length: collaboration.totalSteps }, (_, index) => {
                  const stepNumber = index + 1
                  const isCompleted = stepNumber < collaboration.currentStep
                  const isCurrent = stepNumber === collaboration.currentStep
                  const isPending = stepNumber > collaboration.currentStep
                  
                  return (
                    <div key={stepNumber} className={`flex items-center gap-4 p-4 rounded-lg ${
                      isCompleted ? 'bg-green-50 border-2 border-green-200' :
                      isCurrent ? 'bg-red-50 border-2 border-red-200' :
                      'bg-gray-50 border-2 border-gray-200'
                    }`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        isCompleted ? 'bg-green-600 text-white' :
                        isCurrent ? 'bg-red-600 text-white' :
                        'bg-gray-400 text-white'
                      }`}>
                        {isCompleted ? '✓' : stepNumber}
                      </div>
                      <div className="flex-1">
                        <div className={`font-bold ${
                          isCompleted ? 'text-green-700' :
                          isCurrent ? 'text-red-700' :
                          'text-gray-600'
                        }`}>
                          {getStepName(stepNumber)}
                        </div>
                        <div className={`text-sm ${
                          isCompleted ? 'text-green-600' :
                          isCurrent ? 'text-red-600' :
                          'text-gray-500'
                        }`}>
                          {isCompleted ? '已完成' : isCurrent ? '进行中' : '待开始'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 协作规则 */}
            {collaboration.rules && (
              <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6">
                <h2 className="text-xl font-black text-red-700 mb-4">协作规则</h2>
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                  <div className="text-yellow-800 whitespace-pre-line">
                    {collaboration.rules}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：参与者信息 */}
          <div className="space-y-6">
            {/* 参与者列表 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6">
              <h3 className="text-xl font-black text-red-700 mb-4">参与者</h3>
              
              <div className="space-y-3">
                {collaboration.participants && collaboration.participants.length > 0 ? (
                  collaboration.participants.map((participant, index) => (
                    <div key={participant.id} className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-red-700">{participant.user}</div>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            participant.role === 'creator' ? 'bg-red-600 text-white' :
                            participant.role === 'collaborator' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {participant.role === 'creator' ? '创建者' : 
                             participant.role === 'collaborator' ? '协作者' : '审核者'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            participant.status === 'active' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {participant.status === 'active' ? '活跃' : '不活跃'}
                          </span>
                        </div>
                      </div>
                      
                      {participant.contribution && (
                        <div className="bg-white p-3 rounded-lg border border-red-200 mb-2">
                          <div className="text-sm text-red-600 font-bold mb-1">
                            {participant.contributionType === 'upper_line' ? '上联' :
                             participant.contributionType === 'lower_line' ? '下联' :
                             participant.contributionType === 'horizontal_scroll' ? '横批' :
                             participant.contributionType === 'review' ? '审核意见' : '贡献'}
                          </div>
                          <div className="text-red-800 font-bold">
                            {participant.contribution}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        加入时间: {new Date(participant.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">👥</div>
                    <div className="text-gray-600">暂无参与者</div>
                  </div>
                )}
              </div>
            </div>

            {/* 协作信息 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6">
              <h3 className="text-xl font-black text-red-700 mb-4">协作信息</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">协作类型:</span>
                  <span className="font-bold text-gray-800">
                    {collaboration.collaborationType === 'sequential' ? '顺序协作' : '并行协作'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">总步骤:</span>
                  <span className="font-bold text-gray-800">{collaboration.totalSteps}步</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">当前步骤:</span>
                  <span className="font-bold text-gray-800">{collaboration.currentStep}步</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">参与人数:</span>
                  <span className="font-bold text-gray-800">
                    {collaboration.currentCollaborators}/{collaboration.maxCollaborators}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 返回按钮 */}
        <div className="text-center mt-8">
          <Link
            href="/social/collaborations"
            className="inline-flex items-center gap-2 bg-white text-red-600 px-8 py-4 rounded-full font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-red-200 hover:border-red-400"
          >
            返回协作列表
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ClientCollaborationDetailPage