'use client'

import { Plus, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { useComicCreateStore } from '@/store/creator/comicCreateStore'
import { globalMessage } from '@/components/common/GlobalMessage'
import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

export default function EpisodeList() {
  const router = useRouter()
  const locale = useLocale()
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const {
    episodes,
    currentEpisode,
    setCurrentEpisode,
    addEpisode,
    updateEpisode,
    comicInfo,
    isGenerating,
    isGeneratingEpisode,
    setIsGeneratingEpisode,
  } = useComicCreateStore()

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const handleAddEpisode = async () => {
    if (!comicInfo.prompt.trim()) {
      globalMessage.warning('请先输入创意内容')
      return
    }
    
    if (!comicInfo.title) {
      globalMessage.warning('请先生成漫画标题')
      return
    }
    
    if (!comicInfo.description) {
      globalMessage.warning('请先生成漫画描述')
      return
    }
    
    if (!comicInfo.style) {
      globalMessage.warning('请先选择或生成漫画风格')
      return
    }
    
    if (!comicInfo.category) {
      globalMessage.warning('请先选择或生成漫画分类')
      return
    }
    
    if (!comicInfo.tags || comicInfo.tags.length === 0) {
      globalMessage.warning('请先选择或生成漫画标签')
      return
    }

    const episodeNumber = episodes.length + 1
    
    const tempEpisode = { 
      id: episodeNumber, 
      name: `第${episodeNumber}话`,
      pages: []
    }
    addEpisode(tempEpisode)
    setCurrentEpisode(episodes.length)

    setIsGeneratingEpisode(true)
    try {
      const response = await fetch('/api/creator/generate/episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          episodeNumber,
          prompt: comicInfo.prompt.trim(),
          comicTitle: comicInfo.title,
          comicDescription: comicInfo.description,
          comicStyle: comicInfo.style,
          comicCategory: comicInfo.category,
          comicTags: comicInfo.tags,
          previousEpisodes: episodes,
          model: 'deepseek-chat',
          language: locale
        }),
      })

      const data = await response.json()
      
      if (data.success && data.data) {
        updateEpisode(episodeNumber - 1, {
          name: data.data.title,
          description: data.data.description,
        })
      }
    } catch (error) {
      console.error('生成话内容失败:', error)
    } finally {
      setIsGeneratingEpisode(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-lg p-5 mb-4">
      <div className="flex items-center gap-4">
        {/* 左侧标题卡片 */}
        <div className="flex items-center flex-shrink-0">
          <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
            <BookOpen className="text-purple-600" size={28} />
          </div>
          <div className="ml-3 flex flex-col">
            <div className="text-sm font-bold text-gray-800">话列表</div>
            <div className="text-xs text-gray-500 mb-1.5">共 {episodes.length} 话</div>
            <div className="flex space-x-1.5">
              <button 
                onClick={() => router.push('/creator/chapters')}
                disabled={isGenerating || !comicInfo.prompt?.trim()}
                className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                管理
              </button>
            </div>
          </div>
        </div>

        <div className="w-px h-20 bg-gray-200"></div>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 min-w-[32px] p-0 bg-white rounded-full shadow text-gray-600 hover:bg-gray-50 border-0 flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="overflow-hidden" style={{ width: 'calc(100% - 293px)' }}>
            <div ref={scrollRef} className="flex space-x-3 py-2 overflow-x-scroll scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {episodes.map((episode, epIdx) => (
                <div
                  key={episode.id}
                  onClick={() => setCurrentEpisode(epIdx)}
                  className={`flex-shrink-0 w-24 h-24 rounded-xl border-2 cursor-pointer transition-all ${
                    currentEpisode === epIdx
                      ? 'bg-purple-600 border-purple-600 text-white shadow-lg'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-purple-400'
                  }`}
                >
                  <div className="h-full flex flex-col items-center justify-center p-2">
                    <div className={`text-xs mb-1 ${currentEpisode === epIdx ? 'text-white/70' : 'text-gray-400'}`}>第{epIdx + 1}话</div>
                    <div className="text-xs font-semibold text-center line-clamp-2">{episode.name}</div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={handleAddEpisode}
                disabled={isGenerating || isGeneratingEpisode}
                className="flex-shrink-0 w-24 h-24 min-w-[96px] rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-purple-400 hover:bg-purple-50 text-gray-400 hover:text-purple-600 flex flex-col items-center justify-center p-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={24} />
                <span className="text-xs mt-1">添加话</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 min-w-[32px] p-0 bg-white rounded-full shadow text-gray-600 hover:bg-gray-50 border-0 flex items-center justify-center transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
