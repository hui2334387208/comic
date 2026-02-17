'use client'
import { Watermark } from 'antd'
import * as htmlToImage from 'html-to-image'
import jsPDF from 'jspdf'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import React, { useState, useRef, useCallback, useEffect } from 'react'

import CommentSection from '@/components/comic/CommentSection'
import FavoriteButton from '@/components/comic/FavoriteButton'
import LikeButton from '@/components/comic/LikeButton'
import ComicVersionManager from '@/components/comic/ComicVersionManager'
import DownloadImagesButton from '@/components/comic/DownloadImagesButton'

// AI模型ID到友好名称的映射
const modelMap: Record<string, string> = {
  'deepseek-chat': 'DeepSeek-V3',
  'deepseek-reasoner': 'DeepSeek-R1',
  // 可继续扩展
}

// 漫画分镜数据结构
export interface ComicPanel {
  id: number | string;
  panelNumber: number;
  sceneDescription: string;
  dialogue: string;
  narration: string;
  emotion: string;
  cameraAngle: string;
  characters: string;
}

// 漫画页数据结构
export interface ComicPage {
  id: number;
  pageNumber: number;
  pageLayout: string;
  panelCount: number;
  imageUrl: string;
  status: string;
  panels: ComicPanel[];
}

// 漫画话数据结构
export interface ComicEpisode {
  id: number;
  episodeNumber: number;
  title: string;
  description: string;
  pageCount: number;
  pages: ComicPage[];
}

// 漫画卷数据结构
export interface ComicVolume {
  id: number;
  volumeNumber: number;
  title: string;
  description: string;
  episodeCount: number;
  episodes: ComicEpisode[];
}

// 漫画版本数据结构
export interface ComicVersion {
  id: number;
  comicId: number;
  version: number;
  parentVersionId?: number;
  versionDescription?: string;
  isLatestVersion: boolean;
  frameCount: number; // 漫画帧数
  createdAt: string;
  updatedAt: string;
}

// 漫画数据结构
export interface ComicData {
  id: string;
  title: string;
  description: string;
  category: {
    name: string;
    icon?: string;
    slug?: string;
  };
  model: string;
  style: string;
  coverImage?: string;
  volumeCount: number;
  episodeCount: number;
  createdAt: string;
  volumes: ComicVolume[];
  tags: { id: number; name: string; slug: string }[];
  prompt?: string;
}

interface ClientComicPageProps {
  comic: ComicData | null;
  versions: ComicVersion[];
  currentVersion: ComicVersion | null;
  comicId: string;
}

export default function ClientComicPage({ comic: initialComic, versions: initialVersions, currentVersion: initialCurrentVersion, comicId }: ClientComicPageProps) {
  const t = useTranslations('main.comic.detail')
  const [comic, setComic] = useState<ComicData | null>(initialComic)
  const [versions, setVersions] = useState<ComicVersion[]>(initialVersions)
  const [currentVersion, setCurrentVersion] = useState<ComicVersion | null>(initialCurrentVersion)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [showVersionManager, setShowVersionManager] = useState(false)
  const contentToCaptureRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()
  const [isVip, setIsVip] = useState<boolean>(false)
  const locale = useLocale()
  
  // 阅读模式相关状态
  const [readingMode, setReadingMode] = useState<'overview' | 'reading'>('overview')
  const [currentVolumeIndex, setCurrentVolumeIndex] = useState(0)
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  
  // 折叠状态 - 记录哪些卷是展开的
  const [expandedVolumes, setExpandedVolumes] = useState<Set<number>>(new Set()) // 空Set表示全部展开
  
  // 初始化时展开所有卷
  useEffect(() => {
    if (comic?.volumes) {
      setExpandedVolumes(new Set(comic.volumes.map((_, index) => index)))
    }
  }, [comic?.volumes])

  // 切换卷的展开/折叠状态
  const toggleVolume = (volumeIndex: number) => {
    setExpandedVolumes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(volumeIndex)) {
        newSet.delete(volumeIndex)
      } else {
        newSet.add(volumeIndex)
      }
      return newSet
    })
  }

  // 阅读导航函数
  const startReading = (volumeIndex: number, episodeIndex: number) => {
    setCurrentVolumeIndex(volumeIndex)
    setCurrentEpisodeIndex(episodeIndex)
    setCurrentPageIndex(0)
    setReadingMode('reading')
  }

  const goToNextPage = () => {
    if (!comic?.volumes) return
    
    const currentVolume = comic.volumes[currentVolumeIndex]
    const currentEpisode = currentVolume?.episodes[currentEpisodeIndex]
    
    if (currentPageIndex < (currentEpisode?.pages?.length || 0) - 1) {
      setCurrentPageIndex(prev => prev + 1)
    } else if (currentEpisodeIndex < (currentVolume?.episodes?.length || 0) - 1) {
      setCurrentEpisodeIndex(prev => prev + 1)
      setCurrentPageIndex(0)
    } else if (currentVolumeIndex < comic.volumes.length - 1) {
      setCurrentVolumeIndex(prev => prev + 1)
      setCurrentEpisodeIndex(0)
      setCurrentPageIndex(0)
    }
  }

  const goToPrevPage = () => {
    if (!comic?.volumes) return
    
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1)
    } else if (currentEpisodeIndex > 0) {
      setCurrentEpisodeIndex(prev => prev - 1)
      const prevEpisode = comic.volumes[currentVolumeIndex]?.episodes[currentEpisodeIndex - 1]
      setCurrentPageIndex((prevEpisode?.pages?.length || 1) - 1)
    } else if (currentVolumeIndex > 0) {
      setCurrentVolumeIndex(prev => prev - 1)
      const prevVolume = comic.volumes[currentVolumeIndex - 1]
      setCurrentEpisodeIndex((prevVolume?.episodes?.length || 1) - 1)
      const lastEpisode = prevVolume?.episodes[(prevVolume?.episodes?.length || 1) - 1]
      setCurrentPageIndex((lastEpisode?.pages?.length || 1) - 1)
    }
  }

  const getCurrentPage = () => {
    if (!comic?.volumes) return null
    return comic.volumes[currentVolumeIndex]?.episodes[currentEpisodeIndex]?.pages[currentPageIndex]
  }

  const getCurrentEpisode = () => {
    if (!comic?.volumes) return null
    return comic.volumes[currentVolumeIndex]?.episodes[currentEpisodeIndex]
  }

  const getCurrentVolume = () => {
    if (!comic?.volumes) return null
    return comic.volumes[currentVolumeIndex]
  }

  // 键盘导航
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (readingMode === 'reading') {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          e.preventDefault()
          goToNextPage()
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          goToPrevPage()
        } else if (e.key === 'Escape') {
          setReadingMode('overview')
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [readingMode, currentVolumeIndex, currentEpisodeIndex, currentPageIndex])

  // 获取漫画数据
  useEffect(() => {
    if (initialComic?.volumes && initialComic.volumes.length > 0) {
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/comic/${comicId}`, { cache: 'no-store' })
        const result = await res.json().catch(() => null)
        if (res.ok && result?.success) {
          const apiData = result.data
          const convertedComic: ComicData = {
            id: apiData.id,
            title: apiData.title || t('noTitle'),
            description: apiData.description || t('noDescription'),
            category: {
              name: apiData.category?.name || t('uncategorized'),
              icon: apiData.category?.icon,
              slug: apiData.category?.slug,
            },
            prompt: apiData.prompt,
            model: apiData.model,
            style: apiData.style,
            coverImage: apiData.coverImage,
            volumeCount: apiData.volumeCount || 0,
            episodeCount: apiData.episodeCount || 0,
            createdAt: apiData.createdAt,
            volumes: apiData.volumes || [],
            tags: Array.isArray(apiData.tags) ? apiData.tags : [],
          }
          if (!cancelled) {
            setComic(convertedComic)
          }
        }
      } catch (error) {
        console.error('获取漫画错误:', error)
        if (!cancelled) {
          setError(t('getComicFailed'))
        }
      }
    })()
    return () => { cancelled = true }
  }, [comicId])

  // 仅用于切换版本、重新生成等交互 fetch
  const fetchComicData = async (versionId?: number) => {
    try {
      setLoading(true)
      const url = versionId ? `/api/comic/${comicId}?versionId=${versionId}` : `/api/comic/${comicId}`
      const response = await fetch(url)
      const result = await response.json()
      if (result.success) {
        const apiData = result.data
        const convertedComic = {
          id: apiData.id,
          title: apiData.title || t('noTitle'),
          description: apiData.description || t('noDescription'),
          category: {
            name: apiData.category?.name || t('uncategorized'),
            icon: apiData.category?.icon,
            slug: apiData.category?.slug,
          },
          prompt: apiData.prompt,
          model: apiData.model,
          style: apiData.style,
          coverImage: apiData.coverImage,
          volumeCount: apiData.volumeCount || 0,
          episodeCount: apiData.episodeCount || 0,
          createdAt: apiData.createdAt,
          volumes: apiData.volumes || [],
          tags: Array.isArray(apiData.tags) ? apiData.tags : [],
        }
        setComic(convertedComic)
      } else {
        setError(result.message || t('getComicFailed'))
      }
    } catch (error) {
      console.error('获取漫画错误:', error)
      setError(t('getComicFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleVersionChange = (version: ComicVersion) => {
    setCurrentVersion(version)
    fetchComicData(version.id)
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    setError('')
    try {
      // 限额检查，避免超额仍然触发生成
      const limitRes = await fetch('/api/comic/generate/check-limit', { method: 'POST' })
      const limitData = await limitRes.json()

      if (limitRes.status === 429 && !limitData?.data?.allowed) {
        throw new Error(t('hero.limitExceeded'))
      }
      if (!limitRes.ok) {
        throw new Error(t('hero.generateError'))
      }

      // 重新生成漫画
      const regenerateRes = await fetch('/api/comic/generate/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: comic?.prompt, model: comic?.model, language: locale }),
      })
      
      if (!regenerateRes.ok) {
        throw new Error('重新生成失败')
      }

      // 重新获取数据
      await fetchComicData()
      
      // 重新生成成功后计数 +1
      try { await fetch('/api/comic/generate/increment', { method: 'POST' }) } catch (_) {}
    } catch (error) {
      console.error('重新生成错误:', error)
      setError(t('regenerateFailed'))
    } finally {
      setIsRegenerating(false)
    }
  }



  // const handleExportAsPdf = useCallback(() => {
  //   if (contentToCaptureRef.current === null) {
  //     return
  //   }

  //   htmlToImage.toPng(contentToCaptureRef.current, {
  //     cacheBust: true,
  //     pixelRatio: 2,
  //     backgroundColor: '#ffffff',
  //   })
  //     .then((dataUrl) => {
  //       const img = new Image()
  //       img.src = dataUrl
  //       img.onload = () => {
  //         const pdf = new jsPDF({
  //           orientation: img.width > img.height ? 'l' : 'p',
  //           unit: 'px',
  //           format: [img.width, img.height],
  //         })

  //         const pdfWidth = pdf.internal.pageSize.getWidth()
  //         const pdfHeight = pdf.internal.pageSize.getHeight()

  //         pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight)
  //         pdf.save(`${comic?.title || 'comic'}.pdf`)
  //       }
  //     })
  //     .catch((err) => {
  //       console.error('oops, something went wrong!', err)
  //       setError(t('pdfExportFailed'))
  //     })
  // }, [contentToCaptureRef, comic?.title, t])

  // 获取用户VIP状态
  
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/user/profile')
        .then(res => res.ok ? res.json() : null)
        .then(user => {
          setIsVip(!!user?.isVip)
        })
        .catch(() => { })
    } else {
      setIsVip(false)
    }
  }, [session])

  useEffect(() => {
    // 访问详情页时写入浏览明细
    if (comicId) {
      fetch(`/api/comic/${comicId}/view`, { method: 'POST' })
    }
  }, [comicId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
        {/* 漫画装饰背景 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 opacity-5">
            <svg viewBox="0 0 100 100" className="w-full h-full text-purple-600">
              <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="3"/>
              <circle cx="50" cy="50" r="15" fill="currentColor"/>
            </svg>
          </div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 opacity-5">
            <svg viewBox="0 0 100 100" className="w-full h-full text-pink-600">
              <path d="M30 30 L70 30 L70 70 L30 70 Z" fill="none" stroke="currentColor" strokeWidth="3"/>
              <path d="M40 40 L60 40 L60 60 L40 60 Z" fill="currentColor" opacity="0.5"/>
            </svg>
          </div>
        </div>
        
        <div className="relative text-center">
          <div className="bg-gradient-to-br from-white/95 to-purple-50/80 dark:from-gray-800/95 dark:to-purple-900/30 rounded-3xl shadow-2xl border-2 border-purple-200/50 dark:border-purple-800/50 p-12">
            {/* 漫画风格加载图标 */}
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl shadow-xl animate-pulse"></div>
              <div className="absolute inset-2 bg-gradient-to-br from-pink-400 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-purple-800 text-2xl font-black animate-bounce">漫</span>
              </div>
            </div>
            
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-6" />
            <p className="text-xl font-bold text-purple-700 dark:text-purple-300 mb-2">{t('loadingComic')}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('pleaseWait')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
        {/* 漫画装饰背景 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 opacity-5">
            <svg viewBox="0 0 100 100" className="w-full h-full text-purple-600">
              <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="3"/>
              <circle cx="50" cy="50" r="15" fill="currentColor"/>
            </svg>
          </div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 opacity-5">
            <svg viewBox="0 0 100 100" className="w-full h-full text-pink-600">
              <path d="M30 30 L70 30 L70 70 L30 70 Z" fill="none" stroke="currentColor" strokeWidth="3"/>
              <path d="M40 40 L60 40 L60 60 L40 60 Z" fill="currentColor" opacity="0.5"/>
            </svg>
          </div>
        </div>
        
        <div className="relative text-center">
          <div className="bg-gradient-to-br from-white/95 to-purple-50/80 dark:from-gray-800/95 dark:to-purple-900/30 rounded-3xl shadow-2xl border-2 border-purple-200/50 dark:border-purple-800/50 p-12">
            {/* 漫画风格错误图标 */}
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl shadow-xl"></div>
              <div className="absolute inset-2 bg-gradient-to-br from-pink-400 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-purple-800 text-2xl font-black">❌</span>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-4">{t('problemOccurred')}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">{error}</p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
            >
              <span className="text-xl">🏠</span>
              <span>{t('returnHome')}</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 阅读模式界面
  if (readingMode === 'reading') {
    const currentPage = getCurrentPage()
    const currentEpisode = getCurrentEpisode()
    const currentVolume = getCurrentVolume()
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 opacity-5">
            <svg viewBox="0 0 100 100" className="w-full h-full text-purple-400">
              <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="3"/>
              <circle cx="50" cy="50" r="15" fill="currentColor"/>
            </svg>
          </div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 opacity-5">
            <svg viewBox="0 0 100 100" className="w-full h-full text-pink-400">
              <path d="M30 30 L70 30 L70 70 L30 70 Z" fill="none" stroke="currentColor" strokeWidth="3"/>
              <path d="M40 40 L60 40 L60 60 L40 60 Z" fill="currentColor" opacity="0.5"/>
            </svg>
          </div>
        </div>

        {/* 顶部导航栏 */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/90 via-black/70 to-transparent backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setReadingMode('overview')}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600/80 to-pink-600/80 backdrop-blur-sm text-white rounded-2xl font-bold hover:from-purple-700/90 hover:to-pink-700/90 transition-all duration-300 transform hover:scale-105 shadow-lg border border-white/20"
              >
                <span className="text-lg">←</span>
                <span>返回目录</span>
              </button>
              
              <div className="text-center bg-black/40 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/10">
                <div className="text-sm text-purple-300 font-medium mb-1">
                  第{currentVolume?.volumeNumber}卷 · 第{currentEpisode?.episodeNumber}话
                </div>
                <div className="font-bold text-lg text-white">{currentEpisode?.title}</div>
              </div>
              
              <div className="bg-black/40 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/10">
                <div className="text-sm text-gray-300 text-center">
                  <div className="font-bold text-white">{currentPageIndex + 1}</div>
                  <div className="text-xs">/ {getCurrentEpisode()?.pages?.length || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 主要阅读区域 */}
        <div className="flex items-center justify-center min-h-screen p-4 pt-24 pb-20">
          {currentPage?.imageUrl ? (
            <div className="relative max-w-5xl max-h-[75vh] group">
              {/* 漫画页面 */}
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-white/20">
                <img 
                  src={currentPage.imageUrl} 
                  alt={`第${currentPage.pageNumber}页`}
                  className="w-full h-full object-contain"
                />
                
                {/* 页面编号标识 */}
                <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg border-2 border-white/30">
                  第 {currentPage.pageNumber} 页
                </div>
              </div>
              
              {/* 左右导航按钮 */}
              <button
                onClick={goToPrevPage}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-purple-600/90 to-purple-700/90 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl font-bold hover:from-purple-700 hover:to-purple-800 transition-all duration-300 transform hover:scale-110 shadow-2xl border-2 border-white/20 opacity-0 group-hover:opacity-100"
                disabled={currentVolumeIndex === 0 && currentEpisodeIndex === 0 && currentPageIndex === 0}
              >
                ←
              </button>
              
              <button
                onClick={goToNextPage}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-pink-600/90 to-pink-700/90 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl font-bold hover:from-pink-700 hover:to-pink-800 transition-all duration-300 transform hover:scale-110 shadow-2xl border-2 border-white/20 opacity-0 group-hover:opacity-100"
              >
                →
              </button>

              {/* 点击区域提示 */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-0 top-0 w-1/3 h-full opacity-0 group-hover:opacity-10 bg-gradient-to-r from-purple-500 to-transparent transition-opacity duration-300"></div>
                <div className="absolute right-0 top-0 w-1/3 h-full opacity-0 group-hover:opacity-10 bg-gradient-to-l from-pink-500 to-transparent transition-opacity duration-300"></div>
              </div>
            </div>
          ) : (
            <div className="text-center bg-black/40 backdrop-blur-sm rounded-3xl p-12 border border-white/10">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <span className="text-4xl">📖</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">页面生成中...</h3>
              <p className="text-gray-400">AI正在绘制精彩内容，请稍候</p>
            </div>
          )}
        </div>

        {/* 底部控制栏 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            {/* 进度条 */}
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
                <span className="text-sm font-bold text-white">
                  {currentPageIndex + 1} / {getCurrentEpisode()?.pages?.length || 0}
                </span>
              </div>
              
              <div className="flex-1 bg-white/20 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full h-full transition-all duration-500 shadow-lg"
                  style={{ 
                    width: `${((currentPageIndex + 1) / (getCurrentEpisode()?.pages?.length || 1)) * 100}%` 
                  }}
                />
              </div>

              <div className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
                <span className="text-xs text-gray-300">
                  {Math.round(((currentPageIndex + 1) / (getCurrentEpisode()?.pages?.length || 1)) * 100)}%
                </span>
              </div>
            </div>
            
            {/* 操作提示 */}
            <div className="text-center">
              <div className="inline-flex items-center gap-6 bg-black/40 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/10">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="w-6 h-6 bg-purple-600/50 rounded flex items-center justify-center text-xs font-bold">←</span>
                  <span>上一页</span>
                </div>
                <div className="w-px h-4 bg-white/20"></div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="w-6 h-6 bg-pink-600/50 rounded flex items-center justify-center text-xs font-bold">→</span>
                  <span>下一页</span>
                </div>
                <div className="w-px h-4 bg-white/20"></div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="px-2 py-1 bg-gray-600/50 rounded text-xs font-bold">ESC</span>
                  <span>返回目录</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* 漫画风格背景装饰 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* 漫画风格云纹装饰 */}
        <div className="absolute top-10 left-10 w-40 h-40 opacity-5 dark:opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-purple-600">
            <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="3"/>
            <circle cx="50" cy="50" r="15" fill="currentColor"/>
          </svg>
        </div>
        
        {/* 漫画风格回纹装饰 */}
        <div className="absolute top-32 right-20 w-32 h-32 opacity-5 dark:opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-pink-600">
            <path d="M30 30 L70 30 L70 70 L30 70 Z" fill="none" stroke="currentColor" strokeWidth="3"/>
            <path d="M40 40 L60 40 L60 60 L40 60 Z" fill="currentColor" opacity="0.5"/>
          </svg>
        </div>
        
        {/* 漫画风格如意纹装饰 */}
        <div className="absolute bottom-20 left-20 w-36 h-36 opacity-5 dark:opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-blue-600">
            <path d="M50 10 Q70 20, 80 40 Q90 60, 70 80 Q50 90, 30 80 Q10 60, 20 40 Q30 20, 50 10 Z" 
                  fill="currentColor" opacity="0.4"/>
            <path d="M50 25 Q60 30, 65 45 Q70 60, 60 70 Q50 75, 40 70 Q30 60, 35 45 Q40 30, 50 25 Z" 
                  fill="currentColor" opacity="0.6"/>
          </svg>
        </div>
        
        {/* 漫画风格祥云装饰 */}
        <div className="absolute bottom-32 right-32 w-28 h-28 opacity-5 dark:opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-purple-700">
            <path d="M25 60 Q15 50, 25 40 Q35 30, 50 35 Q65 30, 75 40 Q85 50, 75 60 Q65 70, 50 65 Q35 70, 25 60 Z" 
                  fill="currentColor"/>
          </svg>
        </div>
      </div>

      {/* 页面头部 */}
      <div className="relative bg-gradient-to-r from-purple-600/90 via-purple-700/90 to-purple-800/90 backdrop-blur-sm border-b-2 border-pink-400/50 shadow-lg">
        {/* 传统装饰背景 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-32 h-32">
            <svg viewBox="0 0 100 100" className="w-full h-full text-pink-400">
              <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="3"/>
              <path d="M35 50 Q50 35, 65 50 Q50 65, 35 50" fill="currentColor"/>
            </svg>
          </div>
          <div className="absolute top-0 right-1/4 w-24 h-24">
            <svg viewBox="0 0 100 100" className="w-full h-full text-blue-400">
              <path d="M20 20 L80 20 L80 40 L40 40 L40 60 L80 60 L80 80 L20 80 L20 60 L60 60 L60 40 L20 40 Z" 
                    fill="none" stroke="currentColor" strokeWidth="4"/>
            </svg>
          </div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div>
              {/* 传统印章风格导航 */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-pink-400 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-purple-800 text-sm font-black">联</span>
                </div>
                <div className="flex items-center gap-2 text-pink-100">
                  <Link href="/" className="hover:text-pink-300 transition-colors duration-300 font-medium">
                    {t('backToHome')}
                  </Link>
                  <span className="text-pink-300/60">·</span>
                  <span className="text-pink-200/80">{t('aiGeneratedResult')}</span>
                </div>
              </div>
              
              {/* 漫画标题信息 */}
              {comic && (
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-xl sm:text-2xl font-bold text-pink-100 tracking-wide">
                    {comic.title}
                  </h1>
                  {comic.category && (
                    <div className="inline-flex items-center px-3 py-1 bg-pink-400/20 text-pink-200 rounded-full text-sm border border-pink-400/30">
                      <span className="w-2 h-2 bg-pink-400 rounded-full mr-2 animate-pulse" />
                      {comic.category.name}
                    </div>
                  )}
                  {comic.style && (
                    <div className="inline-flex items-center px-3 py-1 bg-blue-400/20 text-blue-200 rounded-full text-sm border border-blue-400/30">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse" />
                      {comic.style}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
              {/* AI模型标识 - 传统风格 */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-400/20 to-blue-400/20 text-pink-200 rounded-2xl text-sm border border-pink-400/30 backdrop-blur-sm">
                <div className="w-6 h-6 bg-pink-400 rounded-lg flex items-center justify-center">
                  <span className="text-purple-800 text-xs font-bold">AI</span>
                </div>
                <span className="font-medium">{comic?.model ? modelMap[comic.model as string] || comic.model : ''}</span>
              </div>
              
              {/* 操作按钮组 - 传统风格 */}
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold text-sm hover:shadow-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-pink-400/30"
                >
                  {isRegenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{t('regenerating')}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">🎋</span>
                      <span>{t('regenerate')}</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowVersionManager(v => !v)}
                  className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-pink-400/20 to-blue-400/20 text-pink-100 rounded-2xl font-bold text-sm hover:bg-gradient-to-r hover:from-pink-400/30 hover:to-blue-400/30 transition-all duration-300 flex items-center justify-center gap-2 border-2 border-pink-400/30 backdrop-blur-sm"
                >
                  <span className="text-lg">📜</span>
                  <span>{t('viewVersions')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 版本管理面板 */}
        {showVersionManager && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-white/95 to-purple-50/80 dark:from-gray-800/95 dark:to-purple-900/30 rounded-3xl shadow-xl border-2 border-purple-200/50 dark:border-purple-800/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-lg font-black">📚</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('versionManagement')}</h3>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-purple-200 to-transparent"></div>
              </div>
              <ComicVersionManager
                comicId={parseInt(comicId)}
                currentVersion={currentVersion || undefined}
                onVersionChange={handleVersionChange}
                versions={versions}
              />
            </div>
          </div>
        )}

        {/* 漫画标题和描述区域 */}
        {comic && (
          <div className="mb-16">
            <div className="relative overflow-hidden bg-gradient-to-br from-white/95 to-purple-50/80 dark:from-gray-800/95 dark:to-purple-900/30 shadow-2xl border-2 border-purple-200/50 dark:border-purple-900/50 rounded-3xl p-8">
              {/* 装饰背景 */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                <svg viewBox="0 0 100 100" className="w-full h-full text-purple-600">
                  <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="3"/>
                  <circle cx="50" cy="50" r="15" fill="currentColor"/>
                </svg>
              </div>
              
              <div className="relative">
                {/* 漫画标题 */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-3xl shadow-xl border-2 border-blue-400/50 mb-4">
                    <span className="text-3xl mr-4">📚</span>
                    <h1 className="font-black text-2xl sm:text-3xl tracking-wider">{comic.title}</h1>
                  </div>
                </div>

                {/* 漫画描述 */}
                {comic.description && (
                  <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-6 border border-purple-200/50 dark:border-purple-800/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">📝</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">漫画简介</h3>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">{comic.description}</p>
                  </div>
                )}

                {/* 漫画信息标签 */}
                <div className="flex flex-wrap gap-3 justify-center">
                  {comic.category && (
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30 text-pink-700 dark:text-pink-300 rounded-full text-sm font-medium border border-pink-300/50">
                      <span className="w-3 h-3 bg-pink-500 rounded-full mr-2"></span>
                      分类：{comic.category.name}
                    </div>
                  )}
                  {comic.style && (
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-300/50">
                      <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                      风格：{comic.style}
                    </div>
                  )}
                  {comic.volumeCount > 0 && (
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium border border-green-300/50">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      {comic.volumeCount}卷
                    </div>
                  )}
                  {comic.episodeCount > 0 && (
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium border border-orange-300/50">
                      <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                      {comic.episodeCount}话
                    </div>
                  )}
                  {comic.tags && comic.tags.length > 0 && comic.tags.map((tag, index) => (
                    <div key={tag.id} className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium border border-purple-300/50">
                      <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                      {tag.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 漫画内容展示 */}
        <div ref={contentToCaptureRef}>
          <Watermark content={isVip ? '' : t('aiComicWorkshop')} gap={[120, 120]}>
            {/* 漫画封面 */}
            {comic?.coverImage && (
              <div className="mb-16">
                <div className="relative overflow-hidden bg-gradient-to-br from-white/95 to-purple-50/80 dark:from-gray-800/95 dark:to-purple-900/30 shadow-2xl border-2 border-purple-200/50 dark:border-purple-900/50 rounded-3xl p-8">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-6">漫画封面</h2>
                    <div className="relative inline-block">
                      <img 
                        src={comic.coverImage} 
                        alt={comic.title}
                        className="max-w-full h-auto rounded-2xl shadow-xl border-4 border-purple-200/50"
                        style={{ maxHeight: '600px' }}
                      />
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        <span className="text-white text-sm font-bold">📚</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 漫画章节目录 */}
            <div className="space-y-8">
              {comic?.volumes?.map((volume, volumeIndex) => {
                const isExpanded = expandedVolumes.has(volumeIndex)
                
                return (
                  <div key={volume.id} className="bg-gradient-to-br from-white/95 to-purple-50/80 dark:from-gray-800/95 dark:to-purple-900/30 rounded-3xl shadow-xl border-2 border-purple-200/50 dark:border-purple-800/50 overflow-hidden">
                    {/* 卷标题 - 可点击折叠/展开 */}
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white cursor-pointer hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                      onClick={() => toggleVolume(volumeIndex)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <h2 className="text-2xl font-bold">{volume.title}</h2>
                              <span className="text-sm text-white/80">共 {volume.episodes?.length || 0} 话</span>
                            </div>
                            {volume.description && (
                              <p className="text-white/80 mt-1">{volume.description}</p>
                            )}
                          </div>
                        </div>
                        {/* 展开/折叠图标 */}
                        <div className={`transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                          <span className="text-2xl">▼</span>
                        </div>
                      </div>
                    </div>

                    {/* 话列表 - 可折叠 */}
                    <div 
                      className={`transition-all duration-500 ease-in-out overflow-hidden ${
                        isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="p-6">
                        <div className="space-y-4">
                          {volume.episodes?.map((episode, episodeIndex) => (
                            <div 
                              key={episode.id}
                              className="group flex items-center gap-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 cursor-pointer border border-transparent hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-lg"
                              onClick={() => startReading(volumeIndex, episodeIndex)}
                            >
                              {/* 封面缩略图 */}
                              <div className="flex-shrink-0 w-24 h-18 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg overflow-hidden shadow-md">
                                {episode.pages && episode.pages.length > 0 && episode.pages[0]?.imageUrl ? (
                                  <img 
                                    src={episode.pages[0].imageUrl} 
                                    alt={episode.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-3xl">📖</span>
                                  </div>
                                )}
                              </div>

                              {/* 话信息 */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    {episode.title}
                                  </h3>
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {episode.pages?.filter(p => p.imageUrl).length || 0}/{episode.pageCount} 已生成
                                  </span>
                                </div>
                                {episode.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                    {episode.description}
                                  </p>
                                )}
                              </div>

                              {/* 阅读按钮 */}
                              <div className="flex-shrink-0">
                                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 shadow-lg hover:shadow-xl">
                                  <span>📖</span>
                                  <span>阅读</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* 空状态 */}
              {(!comic?.volumes || comic.volumes.length === 0) && (
                <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-purple-300 dark:border-purple-800 bg-gradient-to-br from-purple-50/60 to-blue-50/60 dark:from-gray-900/60 dark:to-gray-800/60 px-8 py-20 text-center">
                  <div className="relative">
                    <div className="text-6xl mb-6">📚</div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                      暂无漫画内容
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                      漫画内容正在生成中，请稍后刷新页面查看
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Watermark>
        </div>

        {/* 操作按钮区域 */}
        <div className="mt-16 flex flex-col gap-6 sm:flex-row sm:gap-6 justify-center items-center">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full sm:w-auto">
            {/* 下载所有图片按钮 */}
            <div className="group relative rounded-2xl font-bold text-lg border-2 transition-all duration-300 bg-gradient-to-br from-white/90 to-purple-50/80 dark:from-gray-800/90 dark:to-purple-900/30 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <DownloadImagesButton comic={comic} />
            </div>

            {/* 导出PDF按钮 */}
            {/* <button
              onClick={handleExportAsPdf}
              className="group relative px-6 py-4 rounded-2xl font-bold text-lg border-2 transition-all duration-300 flex items-center justify-center gap-3 bg-gradient-to-br from-white/90 to-pink-50/80 dark:from-gray-800/90 dark:to-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800 hover:border-pink-400 dark:hover:border-pink-600 hover:shadow-xl active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative w-8 h-8 bg-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-lg">📄</span>
              </div>
              <span className="relative">{t('exportPdf')}</span>
            </button> */}

            {/* 点赞按钮 */}
            <div className="group relative rounded-2xl font-bold text-lg border-2 transition-all duration-300 bg-gradient-to-br from-white/90 to-blue-50/80 dark:from-gray-800/90 dark:to-blue-900/30 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <LikeButton />
            </div>

            {/* 收藏按钮 */}
            <div className="group relative rounded-2xl font-bold text-lg border-2 transition-all duration-300 bg-gradient-to-br from-white/90 to-green-50/80 dark:from-gray-800/90 dark:to-green-900/30 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 hover:shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <FavoriteButton />
            </div>
          </div>
        </div>

        {/* 评论区 */}
        <div className="mt-16">
          <div className="bg-gradient-to-br from-white/95 to-purple-50/80 dark:from-gray-800/95 dark:to-purple-900/30 rounded-3xl shadow-xl border-2 border-purple-200/50 dark:border-purple-800/50 p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                <span className="text-xl font-black">💬</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t('commentSection')}</h3>
              <div className="flex-1 h-0.5 bg-gradient-to-r from-purple-200 to-transparent"></div>
            </div>
            <CommentSection />
          </div>
        </div>
      </div>
    </div>
  )
}

