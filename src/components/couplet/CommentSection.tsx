import dayjs from 'dayjs'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useState, useEffect } from 'react'

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
}

function CommentSection() {
  const params = useParams()
  const t = useTranslations('main.couplet.comment')
  const id = params.id as string
  const [comments, setComments] = useState<Comment[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 获取评论列表
  useEffect(() => {
    if (id) {
      fetchComments()
    }
  }, [id])

  const fetchComments = async () => {
    if (!id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/couplet/${id}/comments`)
      const data = await response.json()

      if (data.success) {
        setComments(data.data.comments)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!input.trim() || !id || submitting) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/couplet/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: input.trim() }),
      })

      const data = await response.json()

      if (data.success) {
        setComments([data.data, ...comments])
        setInput('')
      } else if (data.message === 'Unauthorized' || data.message === '未登录') {
        alert(t('pleaseLogin'))
      } else {
        alert(data.message || t('commentFailed'))
      }
    } catch (error) {
      console.error('Failed to publish comment:', error)
      alert(t('commentFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = dayjs(dateString)
    const now = dayjs()
    const diff = now.diff(date, 'minute')

    if (diff < 1) return t('justNow')
    if (diff < 60) return t('minutesAgo', { minutes: diff })
    if (diff < 1440) return t('hoursAgo', { hours: Math.floor(diff / 60) })
    if (diff < 43200) return t('daysAgo', { days: Math.floor(diff / 1440) })

    return date.format('YYYY-MM-DD')
  }

  return (
    <section className="w-full">
      {loading ? (
        <div className="text-center py-12">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl shadow-xl animate-pulse"></div>
            <div className="absolute inset-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center">
              <span className="text-red-800 text-xl font-black animate-bounce">💬</span>
            </div>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-200 border-t-red-600 mx-auto mb-4" />
          <p className="text-red-700 dark:text-red-300 font-medium">{t('loadingComments')}</p>
        </div>
      ) : (
        <>
          {/* 评论列表 */}
          <div className="space-y-6 mb-8">
            {comments.length === 0 ? (
              <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-red-300 dark:border-red-800 bg-gradient-to-br from-red-50/60 to-amber-50/60 dark:from-gray-900/60 dark:to-gray-800/60 px-8 py-12 text-center">
                {/* 传统装饰背景 */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-4 left-4 w-12 h-12">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
                      <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="3"/>
                      <path d="M35 50 Q50 35, 65 50 Q50 65, 35 50" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="absolute bottom-4 right-4 w-10 h-10">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-orange-600">
                      <path d="M20 20 L80 20 L80 40 L40 40 L40 60 L80 60 L80 80 L20 80 L20 60 L60 60 L60 40 L20 40 Z" 
                            fill="none" stroke="currentColor" strokeWidth="3"/>
                    </svg>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-white text-xl font-black">💬</span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
                    {t('noComments')}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('noComments')}
                  </p>
                </div>
              </div>
            ) : (
              comments.map((comment, index) => (
                <div 
                  key={comment.id} 
                  className="group bg-gradient-to-br from-white/95 to-red-50/80 dark:from-gray-800/95 dark:to-red-900/30 rounded-2xl p-6 border-2 border-red-100/50 dark:border-red-900/50 shadow-lg hover:shadow-xl hover:border-red-200 dark:hover:border-red-800 transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    {/* 用户头像 - 传统印章风格 */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-105 transition-transform duration-300">
                        {comment.user?.name?.[0] || comment.user?.username?.[0] || 'U'}
                      </div>
                      {/* 装饰性印章边框 */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border border-red-600">
                        <span className="text-red-800 text-xs font-bold">•</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* 用户信息 */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-bold text-gray-900 dark:text-white text-lg">
                          {comment.user?.name || comment.user?.username || t('anonymousUser')}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            {formatTime(comment.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      {/* 评论内容 */}
                      <div className="bg-gradient-to-br from-white/80 to-red-50/60 dark:from-gray-700/80 dark:to-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-900/30 shadow-inner">
                        <p className="text-gray-800 dark:text-gray-200 text-base leading-relaxed break-words">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 发表评论区域 */}
          <div className="bg-gradient-to-br from-white/95 to-red-50/80 dark:from-gray-800/95 dark:to-red-900/30 rounded-2xl p-6 border-2 border-red-200/50 dark:border-red-800/50 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-black">💬</span>
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">{t('title')}</h4>
              <div className="flex-1 h-0.5 bg-gradient-to-r from-red-200 to-transparent"></div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <textarea
                  className="w-full px-4 py-3 rounded-xl border-2 border-red-100 dark:border-red-900/50 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white focus:outline-none focus:border-red-400 dark:focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30 transition-all duration-300 resize-none"
                  placeholder={t('commentPlaceholder')}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { 
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit()
                    }
                  }}
                  disabled={submitting}
                  rows={3}
                />
              </div>
              
              <div className="flex flex-col justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !input.trim()}
                  className="group relative px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-bold hover:shadow-xl hover:from-red-700 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 overflow-hidden"
                >
                  {/* 按钮装饰背景 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <span className="relative text-lg">💬</span>
                  <span className="relative">
                    {submitting ? t('publishing') : t('publish')}
                  </span>
                  
                  {submitting && (
                    <div className="relative w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

export default CommentSection
