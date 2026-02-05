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
  const t = useTranslations('main.comic.comment')
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
      const response = await fetch(`/api/comic/${id}/comments`)
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
      const response = await fetch(`/api/comic/${id}/comments`, {
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
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl shadow-xl animate-pulse"></div>
            <div className="absolute inset-2 bg-gradient-to-br from-pink-400 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-purple-800 text-xl font-black animate-bounce">💬</span>
            </div>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4" />
          <p className="text-purple-700 dark:text-purple-300 font-medium">{t('loadingComments')}</p>
        </div>
      ) : (
        <>
          {/* 评论列表 */}
          <div className="space-y-6 mb-8">
            {comments.length === 0 ? (
              <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-purple-300 dark:border-purple-800 bg-gradient-to-br from-purple-50/60 to-pink-50/60 dark:from-gray-900/60 dark:to-purple-900/60 px-8 py-12 text-center">
                {/* 漫画装饰背景 */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-4 left-4 w-12 h-12">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-purple-600">
                      <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="3"/>
                      <circle cx="50" cy="50" r="15" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="absolute bottom-4 right-4 w-10 h-10">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-pink-600">
                      <path d="M30 30 L70 30 L70 70 L30 70 Z" fill="none" stroke="currentColor" strokeWidth="3"/>
                      <path d="M40 40 L60 40 L60 60 L40 60 Z" fill="currentColor" opacity="0.5"/>
                    </svg>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform rotate-3">
                    <span className="text-white text-2xl font-black">💬</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {t('noComments')}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    快来分享你对这个漫画的看法吧！
                  </p>
                </div>
              </div>
            ) : (
              comments.map((comment, index) => (
                <div 
                  key={comment.id} 
                  className="group bg-gradient-to-br from-white/95 to-purple-50/80 dark:from-gray-800/95 dark:to-purple-900/30 rounded-3xl p-6 border-2 border-purple-100/50 dark:border-purple-900/50 shadow-xl hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-500 transform hover:-translate-y-1 overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* 漫画装饰背景 */}
                  <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-purple-600">
                      <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="3"/>
                      <circle cx="50" cy="50" r="15" fill="currentColor"/>
                    </svg>
                  </div>

                  <div className="flex items-start gap-4">
                    {/* 用户头像 - 漫画风格 */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-105 transition-transform duration-300 transform rotate-3 group-hover:rotate-0">
                        {comment.user?.name?.[0] || comment.user?.username?.[0] || 'U'}
                      </div>
                      {/* 装饰性漫画边框 */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-400 rounded-full flex items-center justify-center border border-purple-600">
                        <span className="text-purple-800 text-xs font-bold">•</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* 用户信息 */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-bold text-gray-900 dark:text-white text-lg">
                          {comment.user?.name || comment.user?.username || t('anonymousUser')}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            {formatTime(comment.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      {/* 评论内容 - 漫画对话框风格 */}
                      <div className="relative bg-gradient-to-br from-white/80 to-purple-50/60 dark:from-gray-700/80 dark:to-purple-900/20 rounded-2xl p-4 border-2 border-purple-100 dark:border-purple-900/30 shadow-inner">
                        {/* 对话框小尾巴 */}
                        <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-white/80 dark:border-r-gray-700/80 border-b-8 border-b-transparent"></div>
                        <p className="text-gray-800 dark:text-gray-200 text-base leading-relaxed break-words">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 悬停光效 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-3xl pointer-events-none" />
                </div>
              ))
            )}
          </div>

          {/* 发表评论区域 - 漫画风格 */}
          <div className="relative bg-gradient-to-br from-white/95 to-purple-50/80 dark:from-gray-800/95 dark:to-purple-900/30 rounded-3xl p-8 border-2 border-purple-200/50 dark:border-purple-800/50 shadow-2xl overflow-hidden">
            {/* 装饰背景 */}
            <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
              <svg viewBox="0 0 100 100" className="w-full h-full text-purple-600">
                <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="3"/>
                <circle cx="50" cy="50" r="15" fill="currentColor"/>
              </svg>
            </div>

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                  <span className="text-white text-lg font-black">💬</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h4>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-purple-200 to-transparent"></div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <textarea
                    className="w-full px-6 py-4 rounded-2xl border-2 border-purple-100 dark:border-purple-900/50 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white focus:outline-none focus:border-purple-400 dark:focus:border-purple-600 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 transition-all duration-300 resize-none shadow-inner"
                    placeholder={t('commentPlaceholder') || '分享你对这个漫画的想法...'}
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
                    className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:shadow-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3 overflow-hidden"
                  >
                    {/* 按钮装饰背景 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <span className="relative text-xl">💬</span>
                    <span className="relative text-lg">
                      {submitting ? t('publishing') || '发布中...' : t('publish') || '发布'}
                    </span>
                    
                    {submitting && (
                      <div className="relative w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

export default CommentSection