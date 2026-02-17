import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import React, { useState, useEffect } from 'react'

import LoginPromptModal from '@/components/LoginPromptModal'

function FavoriteButton() {
  const params = useParams()
  const { data: session } = useSession()
  const t = useTranslations('main.comic.favorite')
  const id = params.id as string
  const [favorited, setFavorited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    if (id && session) {
      fetch(`/api/comic/${id}/favorite`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFavorited(data.favorited)
          }
        })
        .catch(console.error)
    }
  }, [id, session])

  const handleFavorite = async () => {
    if (!id || loading) return
    
    // 检查登录状态
    if (!session) {
      setShowLoginModal(true)
      return
    }
    
    setLoading(true)
    try {
      const method = favorited ? 'DELETE' : 'POST'
      const response = await fetch(`/api/comic/${id}/favorite`, { method })
      const data = await response.json()
      if (data.success) {
        setFavorited(data.favorited)
      }
    } catch (error) {
      console.error('Favorite operation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleFavorite}
        disabled={loading}
        className="relative w-full px-8 py-4 text-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 bg-transparent hover:bg-white/20 dark:hover:bg-gray-700/20 active:scale-95"
      >
        <span role="img" aria-label="favorite">{favorited ? '❤️' : '🤍'}</span> {favorited ? t('favorited') : t('favorite')}
      </button>

      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title={t('pleaseLogin')}
        description="登录后即可收藏您喜欢的漫画作品"
        icon="❤️"
      />
    </>
  )
}

export default FavoriteButton
