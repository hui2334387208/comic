import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import React, { useState, useEffect } from 'react'

import LoginPromptModal from '@/components/LoginPromptModal'

function LikeButton() {
  const params = useParams()
  const { data: session } = useSession()
  const t = useTranslations('main.comic.like')
  const id = params.id as string
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    if (id && session) {
      fetch(`/api/comic/${id}/like`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setLiked(data.liked)
          }
        })
        .catch(console.error)
    }
  }, [id, session])

  const handleLike = async () => {
    if (!id || loading) return
    
    // 检查登录状态
    if (!session) {
      setShowLoginModal(true)
      return
    }
    
    setLoading(true)
    try {
      const method = liked ? 'DELETE' : 'POST'
      const response = await fetch(`/api/comic/${id}/like`, { method })
      const data = await response.json()
      if (data.success) {
        setLiked(data.liked)
      }
    } catch (error) {
      console.error('Like operation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleLike}
        disabled={loading}
        className={`w-full sm:w-auto flex-1 px-8 py-4 rounded-2xl text-lg font-semibold border border-white/20 transition-all duration-300 flex items-center justify-center gap-2 bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/80 active:scale-95 mt-0 ${liked ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
      >
        <span role="img" aria-label="like">👍</span> {liked ? t('liked') : t('like')}
      </button>

      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title={t('pleaseLogin')}
        description="登录后即可点赞您喜欢的漫画作品"
        icon="👍"
      />
    </>
  )
}

export default LikeButton
