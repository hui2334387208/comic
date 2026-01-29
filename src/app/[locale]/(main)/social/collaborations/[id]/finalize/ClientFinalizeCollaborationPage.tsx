'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'

interface Contribution {
  user: string
  contribution: string
  contributionType: string
  step: number
  votes: number
  isSelected: boolean
}

interface CollaborationInfo {
  id: number
  title: string
  description: string
  theme: string
  status: string
  currentStep: number
  totalSteps: number
  creator: string
  participants: Contribution[]
  finalWork: {
    upperLine: string
    lowerLine: string
    horizontalScroll: string
  } | null
}

interface Props {
  collaborationId: string
}

const ClientFinalizeCollaborationPage: React.FC<Props> = ({ collaborationId }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const [collaboration, setCollaboration] = useState<CollaborationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedContributions, setSelectedContributions] = useState({
    upperLine: '',
    lowerLine: '',
    horizontalScroll: ''
  })
  const [finalNotes, setFinalNotes] = useState('')

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
        
        // 如果已有最终作品，设置选中的贡献
        if (data.data.finalWork) {
          setSelectedContributions(data.data.finalWork)
        } else {
          // 自动选择得票最高的贡献
          const upperLines = data.data.participants.filter((p: Contribution) => p.contributionType === 'upper_line')
          const lowerLines = data.data.participants.filter((p: Contribution) => p.contributionType === 'lower_line')
          const horizontalScrolls = data.data.participants.filter((p: Contribution) => p.contributionType === 'horizontal_scroll')
          
          setSelectedContributions({
            upperLine: upperLines.length > 0 ? upperLines.sort((a: Contribution, b: Contribution) => (b.votes || 0) - (a.votes || 0))[0].contribution : '',
            lowerLine: lowerLines.length > 0 ? lowerLines.sort((a: Contribution, b: Contribution) => (b.votes || 0) - (a.votes || 0))[0].contribution : '',
            horizontalScroll: horizontalScrolls.length > 0 ? horizontalScrolls.sort((a: Contribution, b: Contribution) => (b.votes || 0) - (a.votes || 0))[0].contribution : ''
          })
        }
      } else {
        setError(data.message || '获取协作信息失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleFinalize = async () => {
    if (!session?.user?.id) {
      router.push('/sign-in')
      return
    }

    if (!selectedContributions.upperLine || !selectedContributions.lowerLine) {
      alert('请至少选择上联和下联')
      return
    }

    try {
      setSubmitting(true)
      
      const response = await fetch(`/api/social/collaborations/${collaborationId}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          finalWork: selectedContributions,
          notes: finalNotes,
          userId: session.user.id
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('作品完善成功！协作项目已完成。')
        router.push(`/social/collaborations/${collaborationId}`)
      } else {
        alert(data.message || '完善失败')
      }
    } catch (error) {
      console.error('完善作品失败:', error)
      alert('完善失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleContributionSelect = (type: 'upperLine' | 'lowerLine' | 'horizontalScroll', contribution: string) => {
    setSelectedContributions(prev => ({
      ...prev,
      [type]: contribution
    }))
  }

  const getContributionsByType = (type: string) => {
    if (!collaboration) return []
    return collaboration.participants.filter(p => p.contributionType === type)
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

  if (collaboration.status !== 'finalizing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <div className="text-red-600 text-xl font-bold mb-4">该协作项目不在完善阶段</div>
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
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-red-700 mb-4">完善作品</h1>
            <p className="text-red-600 text-lg">选择最佳贡献，完成最终作品</p>
          </div>

          {/* 协作信息 */}
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8 mb-8">
            <h2 className="text-2xl font-black text-red-700 mb-4">{collaboration.title}</h2>
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="font-bold text-red-700 mb-2">项目主题</div>
              <div className="text-red-800">{collaboration.theme || '无特定主题'}</div>
            </div>
          </div>

          {/* 最终作品预览 */}
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8 mb-8">
            <h3 className="text-xl font-black text-red-700 mb-6">最终作品预览</h3>
            
            <div className="bg-gradient-to-br from-red-600 to-red-700 text-white p-8 rounded-2xl text-center">
              {selectedContributions.horizontalScroll && (
                <div className="mb-6">
                  <div className="text-red-200 text-sm mb-2">横批</div>
                  <div className="text-2xl font-black">{selectedContributions.horizontalScroll}</div>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <div className="text-red-200 text-sm mb-2">上联</div>
                  <div className="text-3xl font-black">{selectedContributions.upperLine || '请选择上联'}</div>
                </div>
                <div>
                  <div className="text-red-200 text-sm mb-2">下联</div>
                  <div className="text-3xl font-black">{selectedContributions.lowerLine || '请选择下联'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 贡献选择 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* 上联选择 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6">
              <h4 className="text-lg font-black text-red-700 mb-4">选择上联</h4>
              <div className="space-y-3">
                {getContributionsByType('upper_line').map((contrib, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                      selectedContributions.upperLine === contrib.contribution
                        ? 'border-red-500 bg-red-50'
                        : 'border-red-200 hover:border-red-400 hover:bg-red-50'
                    }`}
                    onClick={() => handleContributionSelect('upperLine', contrib.contribution)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-700">{contrib.user}</span>
                      <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full">
                        👍 {contrib.votes || 0}
                      </span>
                    </div>
                    <div className="text-red-800 font-bold text-lg text-center">
                      {contrib.contribution}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 下联选择 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6">
              <h4 className="text-lg font-black text-red-700 mb-4">选择下联</h4>
              <div className="space-y-3">
                {getContributionsByType('lower_line').map((contrib, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                      selectedContributions.lowerLine === contrib.contribution
                        ? 'border-red-500 bg-red-50'
                        : 'border-red-200 hover:border-red-400 hover:bg-red-50'
                    }`}
                    onClick={() => handleContributionSelect('lowerLine', contrib.contribution)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-700">{contrib.user}</span>
                      <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full">
                        👍 {contrib.votes || 0}
                      </span>
                    </div>
                    <div className="text-red-800 font-bold text-lg text-center">
                      {contrib.contribution}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 横批选择 */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-6">
              <h4 className="text-lg font-black text-red-700 mb-4">选择横批（可选）</h4>
              <div className="space-y-3">
                {getContributionsByType('horizontal_scroll').map((contrib, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                      selectedContributions.horizontalScroll === contrib.contribution
                        ? 'border-red-500 bg-red-50'
                        : 'border-red-200 hover:border-red-400 hover:bg-red-50'
                    }`}
                    onClick={() => handleContributionSelect('horizontalScroll', contrib.contribution)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-700">{contrib.user}</span>
                      <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full">
                        👍 {contrib.votes || 0}
                      </span>
                    </div>
                    <div className="text-red-800 font-bold text-lg text-center">
                      {contrib.contribution}
                    </div>
                  </div>
                ))}
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                    selectedContributions.horizontalScroll === ''
                      ? 'border-red-500 bg-red-50'
                      : 'border-red-200 hover:border-red-400 hover:bg-red-50'
                  }`}
                  onClick={() => handleContributionSelect('horizontalScroll', '')}
                >
                  <div className="text-gray-500 text-center">不使用横批</div>
                </div>
              </div>
            </div>
          </div>

          {/* 完善说明 */}
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8 mb-8">
            <h3 className="text-xl font-black text-red-700 mb-4">完善说明</h3>
            <textarea
              value={finalNotes}
              onChange={(e) => setFinalNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
              placeholder="可以说明选择这些贡献的理由，或对最终作品的评价"
            />
          </div>

          {/* 操作按钮 */}
          <div className="text-center">
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleFinalize}
                disabled={submitting || !selectedContributions.upperLine || !selectedContributions.lowerLine}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '完善中...' : '完成作品'}
              </button>
              <Link
                href={`/social/collaborations/${collaborationId}`}
                className="px-8 py-4 border-2 border-red-600 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all duration-300"
              >
                取消
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientFinalizeCollaborationPage