import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useState, useEffect } from 'react'

function LikeButton() {
  const params = useParams()
  const t = useTranslations('main.comic.like')
  const id = params.id as string
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetch(`/api/couplet/${id}/like`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setLiked(data.liked)
          }
        })
        .catch(console.error)
    }
  }, [id])

  const handleLike = async () => {
    if (!id || loading) return
    setLoading(true)
    try {
      const method = liked ? 'DELETE' : 'POST'
      const response = await fetch(`/api/couplet/${id}/like`, { method })
      const data = await response.json()
      if (data.success) {
        setLiked(data.liked)
      } else if (data.message === 'Unauthorized' || data.message === '未登录') {
        alert(t('pleaseLogin'))
      }
    } catch (error) {
      console.error('Like operation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`w-full sm:w-auto flex-1 px-8 py-4 rounded-2xl text-lg font-semibold border border-white/20 transition-all duration-300 flex items-center justify-center gap-2 bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/80 active:scale-95 mt-0 ${liked ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
    >
      <span role="img" aria-label="like">👍</span> {liked ? t('liked') : t('like')}
    </button>
  )
}

export default LikeButton
