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
  currentStep: number
  totalSteps: number
  currentStepDesc: string
  collaborationType: string
  creator: string
  participants: Array<{
    user: string
    contribution: string
    contributionType: string
    step: number
  }>
}

interface Props {
  collaborationId: string
}

const ClientParticipateCollaborationPage: React.FC<Props> = ({ collaborationId }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const [collaboration, setCollaboration] = useState<CollaborationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    contribution: '',
    contributionType: '',
    notes: ''
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
        // 根据当前步骤设置默认贡献类型
        const currentStep = data.data.currentStep
        let defaultType = ''
        if (currentStep === 1) defaultType = 'upper_line'
        else if (currentStep === 2) defaultType = 'lower_line'
        else if (currentStep === 3) defaultType = 'horizontal_scroll'
        else if (currentStep === 4) defaultType = 'review'
        
        setFormData(prev => ({ ...prev, contributionType: defaultType }))
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

    if (!formData.contribution || !formData.contributionType) {
      alert('请填写贡献内容和类型')
      return
    }

    try {
      setSubmitting(true)
      
      const response = await fetch(`/api/social/collaborations/${collaborationId}/contribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: session.user.id,
          step: collaboration?.currentStep
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('贡献提交成功！')
        router.push(`/social/collaborations/${collaborationId}`)
      } else {
        alert(data.message || '提交失败')
      }
    } catch (error) {
      console.error('提交贡献失败:', error)
      alert('提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const getStepName = (step: number) => {
    const stepNames = ['准备阶段', '上联创作', '下联创作', '横批创作', '完善润色']
    return stepNames[step - 1] || `第${step}步`
  }

  const getContributionTypeName = (type: string) => {
    switch (type) {
      case 'upper_line': return '上联'
      case 'lower_line': return '下联'
      case 'horizontal_scroll': return '横批'
      case 'review': return '审核意见'
      case 'polish': return '润色建议'
      default: return '其他'
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

  if (collaboration.status !== 'ongoing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <div className="text-red-600 text-xl font-bold mb-4">该协作项目不在进行阶段</div>
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
        <div className="max-w-3xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-red-700 mb-4">参与创作</h1>
            <p className="text-red-600 text-lg">为协作项目贡献你的创意</p>
          </div>

          {/* 协作信息 */}
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8 mb-8">
            <h2 className="text-2xl font-black text-red-700 mb-6">{collaboration.title}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="font-bold text-red-700 mb-2">当前步骤</div>
                <div className="text-red-800 font-black text-xl">
                  {getStepName(collaboration.currentStep)} ({collaboration.currentStep}/{collaboration.totalSteps})
                </div>
              </div>
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                <div className="font-bold text-orange-700 mb-2">协作类型</div>
                <div className="text-orange-800 font-black text-xl">
                  {collaboration.collaborationType === 'sequential' ? '顺序协作' : '并行协作'}
                </div>
              </div>
            </div>

            {/* 已有贡献展示 */}
            {collaboration.participants && collaboration.participants.length > 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
                <div className="font-bold text-yellow-700 mb-3">已有贡献</div>
                <div className="space-y-3">
                  {collaboration.participants
                    .filter(p => p.contribution && p.step === collaboration.currentStep)
                    .map((participant, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-yellow-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-700">{participant.user}</span>
                        <span className="text-sm bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                          {getContributionTypeName(participant.contributionType)}
                        </span>
                      </div>
                      <div className="text-red-800 font-bold text-lg">
                        {participant.contribution}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 贡献表单 */}
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-xl font-black text-red-700 border-b-2 border-red-200 pb-2">提交贡献</h2>
              
              <div>
                <label className="block text-red-700 font-bold mb-2">贡献类型 *</label>
                <select
                  name="contributionType"
                  value={formData.contributionType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                  required
                >
                  <option value="">请选择贡献类型</option>
                  {collaboration.currentStep === 1 && (
                    <option value="upper_line">上联</option>
                  )}
                  {collaboration.currentStep === 2 && (
                    <option value="lower_line">下联</option>
                  )}
                  {collaboration.currentStep === 3 && (
                    <option value="horizontal_scroll">横批</option>
                  )}
                  {collaboration.currentStep >= 4 && (
                    <>
                      <option value="review">审核意见</option>
                      <option value="polish">润色建议</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-red-700 font-bold mb-2">
                  {formData.contributionType === 'review' ? '审核意见' : 
                   formData.contributionType === 'polish' ? '润色建议' : '创作内容'} *
                </label>
                <textarea
                  name="contribution"
                  value={formData.contribution}
                  onChange={handleInputChange}
                  rows={formData.contributionType === 'review' || formData.contributionType === 'polish' ? 6 : 3}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none text-center text-xl font-bold"
                  placeholder={
                    formData.contributionType === 'upper_line' ? '请输入上联' :
                    formData.contributionType === 'lower_line' ? '请输入下联' :
                    formData.contributionType === 'horizontal_scroll' ? '请输入横批' :
                    formData.contributionType === 'review' ? '请输入审核意见和建议' :
                    formData.contributionType === 'polish' ? '请输入润色建议' :
                    '请输入你的贡献内容'
                  }
                  required
                />
                {(formData.contributionType === 'upper_line' || formData.contributionType === 'lower_line' || formData.contributionType === 'horizontal_scroll') && (
                  <div className="text-sm text-gray-600 mt-2 text-center">
                    字数：{formData.contribution.length}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-red-700 font-bold mb-2">创作说明</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none"
                  placeholder="可以说明你的创作思路、灵感来源等"
                />
              </div>

              {/* 创作提示 */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-700 mb-2">创作提示</h3>
                <div className="text-blue-800 text-sm space-y-1">
                  {formData.contributionType === 'upper_line' && (
                    <>
                      <p>• 上联通常描述景物、情境或提出问题</p>
                      <p>• 注意平仄格律，为下联留下对仗空间</p>
                      <p>• 考虑主题：{collaboration.theme || '无特定主题'}</p>
                    </>
                  )}
                  {formData.contributionType === 'lower_line' && (
                    <>
                      <p>• 下联要与上联对仗工整，平仄相对</p>
                      <p>• 内容上要呼应上联，形成完整意境</p>
                      <p>• 可以是回答、补充或升华</p>
                    </>
                  )}
                  {formData.contributionType === 'horizontal_scroll' && (
                    <>
                      <p>• 横批要概括对联的主旨</p>
                      <p>• 通常为4个字，简洁有力</p>
                      <p>• 要与上下联形成完整的意境</p>
                    </>
                  )}
                  {(formData.contributionType === 'review' || formData.contributionType === 'polish') && (
                    <>
                      <p>• 从平仄、对仗、意境等方面给出建议</p>
                      <p>• 提出具体的修改意见</p>
                      <p>• 保持建设性和友善的态度</p>
                    </>
                  )}
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '提交中...' : '提交贡献'}
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

export default ClientParticipateCollaborationPage