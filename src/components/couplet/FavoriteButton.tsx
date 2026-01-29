import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useState, useEffect } from 'react'

function FavoriteButton() {
  const params = useParams()
  const t = useTranslations('main.couplet.favorite')
  const id = params.id as string
  const [favorited, setFavorited] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetch(`/api/couplet/${id}/favorite`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFavorited(data.favorited)
          }
        })
        .catch(console.error)
    }
  }, [id])

  const handleFavorite = async () => {
    if (!id || loading) return
    setLoading(true)
    try {
      const method = favorited ? 'DELETE' : 'POST'
      const response = await fetch(`/api/couplet/${id}/favorite`, { method })
      const data = await response.json()
      if (data.success) {
        setFavorited(data.favorited)
      } else if (data.message === 'Unauthorized' || data.message === '未登录') {
        alert(t('pleaseLogin'))
      }
    } catch (error) {
      console.error('Favorite operation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleFavorite}
      disabled={loading}
      className={`w-full sm:w-auto flex-1 px-8 py-4 rounded-2xl text-lg font-semibold border border-white/20 transition-all duration-300 flex items-center justify-center gap-2 bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/80 active:scale-95 mt-0 ${favorited ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300' : ''}`}
    >
      <span role="img" aria-label="favorite">{favorited ? '❤️' : '🤍'}</span> {favorited ? t('favorited') : t('favorite')}
    </button>
  )
}

export default FavoriteButton
