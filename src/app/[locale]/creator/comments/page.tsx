'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CommentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState([])
  const [filter, setFilter] = useState('all')
  const [replyTo, setReplyTo] = useState<any>(null)
  const [replyContent, setReplyContent] = useState('')

  useEffect(() => {
    fetchComments()
  }, [filter])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/creator/comments?filter=${filter}`)
      const result = await response.json()
      if (result.success) {
        setComments(result.data.comments)
      }
    } catch (error) {
      console.error('获取评论失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async () => {
    if (!replyContent.trim()) {
      alert('请输入回复内容')
      return
    }

    try {
      const response = await fetch('/api/creator/comments/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId: replyTo.id,
          content: replyContent,
        }),
      })
      const result = await response.json()
      if (result.success) {
        alert('回复成功')
        setReplyTo(null)
        setReplyContent('')
        fetchComments()
      } else {
        alert(result.error || '回复失败')
      }
    } catch (error) {
      alert('回复失败')
    }
  }

  const handleDelete = async (commentId: number) => {
    if (!confirm('确定要删除这条评论吗？')) return

    try {
      const response = await fetch(`/api/creator/comments/${commentId}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (result.success) {
        alert('删除成功')
        fetchComments()
      } else {
        alert(result.error || '删除失败')
      }
    } catch (error) {
      alert('删除失败')
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          互动管理
        </h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-6 py-3 border-2 border-indigo-200 rounded-xl focus:border-indigo-600 focus:outline-none font-bold"
        >
          <option value="all">全部评论</option>
          <option value="unread">未读</option>
          <option value="replied">已回复</option>
        </select>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { icon: '💬', label: '总评论数', value: comments.length },
          { icon: '📬', label: '未读评论', value: comments.filter((c: any) => !c.isRead).length },
          { icon: '✅', label: '已回复', value: comments.filter((c: any) => c.hasReply).length },
          { icon: '❤️', label: '获赞评论', value: comments.filter((c: any) => c.likeCount > 0).length },
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

      {/* 评论列表 */}
      <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-indigo-200/50">
        <h2 className="text-2xl font-black text-gray-800 mb-6">评论列表</h2>
        {loading ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment: any) => (
              <div key={comment.id} className={`p-6 rounded-2xl border-2 ${comment.isRead ? 'border-gray-100' : 'border-indigo-200 bg-indigo-50'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                      {comment.user.avatar ? (
                        <img src={comment.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span>{comment.user.name[0]}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-bold text-gray-800">{comment.user.name}</p>
                        {!comment.isRead && <span className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-full">新</span>}
                      </div>
                      <p className="text-gray-700 mb-2">{comment.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>📚 {comment.comicTitle}</span>
                        <span>🕐 {new Date(comment.createdAt).toLocaleString()}</span>
                        <span>❤️ {comment.likeCount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReplyTo(comment)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                    >
                      回复
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="px-4 py-2 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600"
                    >
                      删除
                    </button>
                  </div>
                </div>
                {comment.reply && (
                  <div className="ml-16 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">你的回复:</p>
                    <p className="text-gray-800">{comment.reply.content}</p>
                    <p className="text-xs text-gray-500 mt-2">{new Date(comment.reply.createdAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-gray-500">暂无评论</p>
          </div>
        )}
      </div>

      {/* 回复弹窗 */}
      {replyTo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setReplyTo(null)}>
          <div className="bg-white rounded-3xl p-10 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-3xl font-black text-gray-800 mb-6">回复评论</h2>
            <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
              <p className="text-sm text-gray-600 mb-2">{replyTo.user.name} 说:</p>
              <p className="text-gray-800">{replyTo.content}</p>
            </div>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="输入你的回复..."
              rows={4}
              className="w-full px-6 py-4 border-2 border-indigo-200 rounded-2xl focus:border-indigo-600 focus:outline-none mb-6"
            />
            <div className="flex gap-4">
              <button
                onClick={() => setReplyTo(null)}
                className="flex-1 py-4 bg-gray-200 text-gray-700 rounded-2xl font-bold"
              >
                取消
              </button>
              <button
                onClick={handleReply}
                className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold"
              >
                发送回复
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
