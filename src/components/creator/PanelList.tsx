'use client'

import { Plus, Grid, ChevronLeft, ChevronRight } from 'lucide-react'
import { useComicCreateStore } from '@/store/creator/comicCreateStore'
import { globalMessage } from '@/components/common/GlobalMessage'
import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

export default function PanelList() {
  const router = useRouter()
  const locale = useLocale()
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const {
    episodes,
    currentEpisode,
    currentPage,
    addPanel,
    updatePanel,
    comicInfo,
    isGenerating,
    isGeneratingEpisode,
    isGeneratingPage,
    isGeneratingPanel,
    setIsGeneratingPanel,
  } = useComicCreateStore()

  const currentEp = episodes[currentEpisode]
  const currentPg = currentEp?.pages[currentPage]
  const currentPanels = currentPg?.panels || []

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const handleAddPanel = async () => {
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
    
    if (!currentEp) {
      globalMessage.warning('请先创建一个话')
      return
    }
    
    if (!currentPg) {
      globalMessage.warning('请先创建一个页')
      return
    }

    const panelNumber = currentPg.panels.length + 1
    
    const tempPanel = { 
      id: panelNumber
    }
    
    addPanel(currentEpisode, currentPage, tempPanel)

    setIsGeneratingPanel(true)
    try {
      const response = await fetch('/api/creator/generate/panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          panelNumber,
          prompt: comicInfo.prompt.trim(),
          comicTitle: comicInfo.title,
          comicDescription: comicInfo.description,
          comicStyle: comicInfo.style,
          comicCategory: comicInfo.category,
          comicTags: comicInfo.tags,
          episodeTitle: currentEp.name,
          episodeDescription: currentEp.description,
          pageLayout: currentPg.pageLayout,
          panelCount: currentPg.panelCount,
          previousPanels: currentPg.panels,
          model: 'deepseek-chat',
          language: locale
        }),
      })

      const data = await response.json()
      
      if (data.success && data.data) {
        updatePanel(currentEpisode, currentPage, panelNumber - 1, {
          panelNumber: panelNumber,
          sceneDescription: data.data.sceneDescription,
          dialogue: data.data.dialogue,
          narration: data.data.narration,
          emotion: data.data.emotion,
          cameraAngle: data.data.cameraAngle,
          characters: data.data.characters
        })
      }
    } catch (error) {
      console.error('生成分镜内容失败:', error)
    } finally {
      setIsGeneratingPanel(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-lg p-5 mb-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center flex-shrink-0">
          <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center">
            <Grid className="text-orange-600" size={28} />
          </div>
          <div className="ml-3 flex flex-col">
            <div className="text-sm font-bold text-gray-800">第{currentPage + 1}页分镜列表</div>
            <div className="text-xs text-gray-500 mb-1.5">共 {currentPanels.length || 0} 格</div>
            <div className="flex space-x-1.5">
              <button 
                onClick={() => router.push('/creator/panels')}
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
              {currentPanels.map((panel, panelIdx) => (
                <div
                  key={panel.id}
                  className="flex-shrink-0 w-24 h-24 rounded-xl border-2 bg-white border-gray-300 text-gray-700 hover:border-orange-400 cursor-pointer transition-all"
                >
                  <div className="h-full flex flex-col items-center justify-center p-2">
                    <div className="text-xs font-semibold mb-1">第{panelIdx + 1}格</div>
                    <div className="text-xs text-gray-400">
                      分镜
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={handleAddPanel}
                disabled={isGenerating || isGeneratingEpisode || isGeneratingPage || isGeneratingPanel}
                className="flex-shrink-0 w-24 h-24 min-w-[96px] rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-orange-400 hover:bg-orange-50 text-gray-400 hover:text-orange-600 flex flex-col items-center justify-center p-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={24} />
                <span className="text-xs mt-1">添加分镜</span>
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
