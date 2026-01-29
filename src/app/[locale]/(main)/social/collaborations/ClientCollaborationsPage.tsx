'use client'

import React, { useState, useEffect } from 'react'
import { Link, useRouter } from '@/i18n/navigation'

interface Collaboration {
  id: number
  title: string
  description: string
  theme: string
  status: string
  maxCollaborators: number
  currentCollaborators: number
  collaborationType: string
  progress: number
  currentStepDesc: string
  creator: string
  participants: Array<{
    user: string
    contribution: string
    contributionType: string
  }>
}

const ClientCollaborationsPage: React.FC = () => {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState('all')
  const [collaborations, setCollaborations] = useState<Collaboration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCollaborations()
  }, [activeFilter])

  const fetchCollaborations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeFilter !== 'all') {
        params.append('status', activeFilter)
      }
      
      const response = await fetch(`/api/social/collaborations?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setCollaborations(data.data.collaborations)
      } else {
        setError(data.message || '获取数据失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinCollaboration = async (collaborationId: number) => {
    router.push(`/social/collaborations/join/${collaborationId}`)
  }

  const handleParticipateCollaboration = (collaborationId: number) => {
    // 跳转到协作创作页面
    router.push(`/social/collaborations/${collaborationId}/create`)
  }

  const handleFinalizeCollaboration = (collaborationId: number) => {
    // 跳转到完善作品页面
    router.push(`/social/collaborations/${collaborationId}/finalize`)
  }

  const handleViewCollaborationDetails = (collaborationId: number) => {
    // 跳转到详情页面
    router.push(`/social/collaborations/${collaborationId}`)
  }

  const handleCreateCollaboration = () => {
    // 跳转到创建协作页面
    router.push('/social/collaborations/create')
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

  const getDifficultyColor = (collaborationType: string) => {
    switch (collaborationType) {
      case 'sequential': return { text: '顺序协作', color: 'text-red-600 bg-red-100' }
      case 'parallel': return { text: '并行协作', color: 'text-orange-600 bg-orange-100' }
      default: return { text: '未知', color: 'text-gray-600 bg-gray-100' }
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <div className="text-red-600 text-xl font-bold mb-4">{error}</div>
          <button 
            onClick={fetchCollaborations}
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
              协作创作
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full opacity-80 flex items-center justify-center text-white text-sm font-bold">🤝</div>
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
          </div>
          <p className="text-red-600 text-lg font-bold mt-6 max-w-2xl mx-auto">
            众人拾柴火焰高，集思广益创佳联，合作共赢展才华
          </p>
        </div>

        {/* 操作栏 */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          {/* 筛选按钮 */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: '全部项目', icon: '📋' },
              { key: 'recruiting', label: '招募中', icon: '📢' },
              { key: 'ongoing', label: '进行中', icon: '🔄' },
              { key: 'finalizing', label: '完善中', icon: '✨' }
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

          {/* 发起协作按钮 */}
          <button 
            onClick={handleCreateCollaboration}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-full font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-red-500"
          >
            <span className="mr-2">🤝</span>
            发起协作
          </button>
        </div>

        {/* 协作项目列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {collaborations.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <div className="text-red-600 text-xl font-bold">暂无协作项目</div>
              <div className="text-gray-600 mt-2">快来发起第一个协作创作项目吧！</div>
            </div>
          ) : (
            collaborations.map(collab => {
              const difficulty = getDifficultyColor(collab.collaborationType || 'sequential')
              return (
                <div key={collab.id} className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 hover:border-red-400 transform hover:scale-105 transition-all duration-300 overflow-hidden">
                  {/* 卡片头部 */}
                  <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white relative">
                    <div className="absolute top-4 right-4 flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(collab.status)} text-white`}>
                        {getStatusText(collab.status)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${difficulty.color}`}>
                        {difficulty.text}
                      </span>
                    </div>
                    <h3 className="text-xl font-black mb-2 pr-20">{collab.title}</h3>
                    <p className="text-red-100 text-sm leading-relaxed">{collab.description}</p>
                  </div>

                  {/* 卡片内容 */}
                  <div className="p-6 space-y-4">
                    {/* 协作信息 */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-red-600 font-bold mb-1">协作者</div>
                        <div className="text-red-800 font-black text-lg">
                          {collab.currentCollaborators}/{collab.maxCollaborators}
                        </div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="text-orange-600 font-bold mb-1">完成度</div>
                        <div className="text-orange-800 font-black text-lg">{collab.progress}%</div>
                      </div>
                    </div>

                    {/* 进度条 */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-bold text-gray-600">
                        <span>创作进度</span>
                        <span>{collab.currentStepDesc}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-red-500 to-orange-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${collab.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* 贡献展示 */}
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">✍️</span>
                        <span className="font-bold text-yellow-700">当前贡献</span>
                      </div>
                      <div className="space-y-2">
                        {collab.participants && collab.participants.length > 0 ? (
                          collab.participants.slice(0, 3).map((contrib, index) => (
                            <div key={index} className="bg-white p-3 rounded-lg border border-yellow-200">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-bold text-gray-600">{contrib.user}</span>
                                <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                                  {contrib.contributionType}
                                </span>
                              </div>
                              <div className="text-red-700 font-bold text-lg">{contrib.contribution || '暂无贡献'}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500 text-center py-2">暂无贡献内容</div>
                        )}
                      </div>
                    </div>

                    {/* 项目详情 */}
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <div>
                        <span className="font-bold">主题:</span> {collab.theme || '无'}
                      </div>
                      <div>
                        <span className="font-bold">发起人:</span> {collab.creator}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-3 pt-4">
                      {collab.status === 'recruiting' && (
                        <button 
                          onClick={() => handleJoinCollaboration(collab.id)}
                          className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                        >
                          加入协作
                        </button>
                      )}
                      {collab.status === 'ongoing' && (
                        <button 
                          onClick={() => handleParticipateCollaboration(collab.id)}
                          className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                        >
                          参与创作
                        </button>
                      )}
                      {collab.status === 'finalizing' && (
                        <button 
                          onClick={() => handleFinalizeCollaboration(collab.id)}
                          className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                        >
                          完善作品
                        </button>
                      )}
                      <button 
                        onClick={() => handleViewCollaborationDetails(collab.id)}
                        className="px-6 py-3 border-2 border-red-600 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all duration-300"
                      >
                        详情
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
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

export default ClientCollaborationsPage