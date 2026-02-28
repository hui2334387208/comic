'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReviewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchReviews()
  }, [filter])

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/creator/reviews?status=${filter}`)
      const result = await response.json()
      if (result.success) {
        setReviews(result.data.reviews)
      }
    } catch (error) {
      console.error('获取审核记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: '⏳', label: '审核中', color: 'yellow' }
      case 'approved':
        return { icon: '✅', label: '已通过', color: 'green' }
      case 'rejected':
        return { icon: '❌', label: '未通过', color: 'red' }
      default:
        return { icon: '📝', label: '草稿', color: 'gray' }
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          内容审核
        </h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-6 py-3 border-2 border-indigo-200 rounded-xl focus:border-indigo-600 focus:outline-none font-bold"
        >
          <option value="all">全部</option>
          <option value="pending">审核中</option>
          <option value="approved">已通过</option>
          <option value="rejected">未通过</option>
        </select>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { icon: '📝', label: '总提交数', value: reviews.length },
          { icon: '⏳', label: '审核中', value: reviews.filter((r: any) => r.status === 'pending').length },
          { icon: '✅', label: '已通过', value: reviews.filter((r: any) => r.status === 'approved').length },
          { icon: '❌', label: '未通过', value: reviews.filter((r: any) => r.status === 'rejected').length },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl p-8 shadow-xl border-4 border-indigo-200/50">
            <span className="text-5xl mb-4 block">{stat.icon}</span>
            <p className="text-gray-500 text-sm font-bold mb-2">{stat.label}</p>
            <p className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* 审核列表 */}
      <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-indigo-200/50">
        <h2 className="text-2xl font-black text-gray-800 mb-6">审核记录</h2>
        {loading ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review: any) => {
              const statusInfo = getStatusInfo(review.status)
              return (
                <div
                  key={review.id}
                  onClick={() => router.push(`/creator/works/${review.comicId}`)}
                  className="flex items-center justify-between p-6 rounded-2xl hover:bg-indigo-50 transition-all cursor-pointer border-2 border-gray-100"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                      {review.coverImage ? (
                        <img src={review.coverImage} alt="" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <span className="text-3xl">🎨</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-lg">{review.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">提交时间: {new Date(review.submittedAt).toLocaleString()}</p>
                      {review.status === 'rejected' && review.reason && (
                        <p className="text-sm text-red-600 mt-2">❌ 拒绝原因: {review.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`px-6 py-3 rounded-xl font-bold ${
                      statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                      statusInfo.color === 'green' ? 'bg-green-100 text-green-700' :
                      statusInfo.color === 'red' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {statusInfo.icon} {statusInfo.label}
                    </div>
                    {review.status === 'rejected' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/creator/works/${review.comicId}/edit`)
                        }}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                      >
                        重新编辑
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500">暂无审核记录</p>
          </div>
        )}
      </div>
    </div>
  )
}
