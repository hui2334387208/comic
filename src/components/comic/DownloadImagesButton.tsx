'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import LoginPromptModal from '@/components/LoginPromptModal'

interface DownloadImagesButtonProps {
  comic: {
    title: string
    coverImage?: string
    volumes?: Array<{
      volumeNumber: number
      episodes?: Array<{
        episodeNumber: number
        pages?: Array<{
          pageNumber: number
          imageUrl?: string
        }>
      }>
    }>
  } | null
}

export default function DownloadImagesButton({ comic }: DownloadImagesButtonProps) {
  const { data: session } = useSession()
  const t = useTranslations('main.comic.detail')
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)

  const handleDownloadAllImages = async () => {
    if (!comic || isDownloading) return

    // 检查登录状态
    if (!session) {
      setShowLoginModal(true)
      return
    }

    setIsDownloading(true)
    setError('')

    try {
      const images: { url: string; filename: string }[] = []
      
      // 1. 收集封面
      if (comic.coverImage) {
        images.push({
          url: comic.coverImage,
          filename: `${comic.title || 'comic'}_封面.png`
        })
      }

      // 2. 收集所有卷的所有话的所有页面
      comic.volumes?.forEach((volume) => {
        volume.episodes?.forEach((episode) => {
          episode.pages?.forEach((page) => {
            if (page.imageUrl) {
              images.push({
                url: page.imageUrl,
                filename: `${comic.title || 'comic'}_第${volume.volumeNumber}卷_第${episode.episodeNumber}话_第${page.pageNumber}页.png`
              })
            }
          })
        })
      })

      if (images.length === 0) {
        setError('暂无可下载的图片')
        return
      }

      // 3. 逐个下载图片
      for (let i = 0; i < images.length; i++) {
        const { url, filename } = images[i]
        try {
          const response = await fetch(url)
          const blob = await response.blob()
          const blobUrl = window.URL.createObjectURL(blob)
          
          const link = document.createElement('a')
          link.href = blobUrl
          link.download = filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          window.URL.revokeObjectURL(blobUrl)
          
          // 延迟避免浏览器阻止
          if (i < images.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        } catch (error) {
          console.error(`下载失败: ${filename}`, error)
        }
      }
    } catch (error) {
      console.error('下载图片错误:', error)
      setError('下载失败，请重试')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleDownloadAllImages}
        disabled={isDownloading}
        className="relative w-full px-6 py-4 flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="relative w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
          {isDownloading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <span className="text-lg">🖼️</span>
          )}
        </div>
        
        <span className="relative text-purple-700 dark:text-purple-300 font-bold">
          {isDownloading ? '下载中...' : '下载图片'}
        </span>
        
        {error && (
          <span className="absolute -bottom-6 left-0 right-0 text-xs text-red-600 dark:text-red-400 text-center">
            {error}
          </span>
        )}
      </button>

      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="请先登录"
        description="登录后即可下载漫画图片"
        icon="🖼️"
      />
    </>
  )
}
