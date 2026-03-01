'use client'

import { useState, useRef } from 'react'
import { Save, Sparkles, Plus, X, BookOpen, ChevronLeft, ChevronRight, FileText, Grid } from 'lucide-react'
import { Button } from 'antd'
import { useRouter } from 'next/navigation'
import VolumeModal from '@/components/creator/VolumeModal'
import ChapterModal from '@/components/creator/ChapterModal'
import PageModal from '@/components/creator/PageModal'
import PanelModal from '@/components/creator/PanelModal'
import { useVolumeModalStore } from '@/store/creator/volumeStore'
import { useChapterModalStore } from '@/store/creator/chapterStore'
import { usePageModalStore } from '@/store/creator/pageStore'
import { usePanelModalStore } from '@/store/creator/panelStore'

export default function CreatePage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { open: openVolumeModal } = useVolumeModalStore()
  const { open: openChapterModal } = useChapterModalStore()
  const { open: openPageModal } = usePageModalStore()
  const { open: openPanelModal } = usePanelModalStore()
  
  // 漫画基本信息
  const [comicTitle, setComicTitle] = useState('')
  const [comicDescription, setComicDescription] = useState('')
  const [comicCategory, setComicCategory] = useState('')
  const [comicTags, setComicTags] = useState<string[]>([])
  
  // 卷话页结构
  const [volumes, setVolumes] = useState([{ id: 1, name: '第1卷', title: '', description: '', coverImage: '', chapters: [{ id: 1, name: '第1话', pages: [{ id: 1, panels: [] }] }] }])
  const [currentVolume, setCurrentVolume] = useState(0)
  const [currentChapter, setCurrentChapter] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const handleCreateVolume = (data: { name: string; title: string; description: string; coverImage: string }) => {
    setVolumes([...volumes, { 
      id: volumes.length + 1, 
      name: data.name,
      title: data.title,
      description: data.description,
      coverImage: data.coverImage,
      chapters: [{ id: 1, name: '第1话', pages: [{ id: 1, panels: [] }] }] 
    }])
  }

  const handleCreateChapter = (data: { title: string; description: string }) => {
    const newVolumes = [...volumes]
    const chapters = newVolumes[currentVolume].chapters
    newVolumes[currentVolume].chapters = [...chapters, { 
      id: chapters.length + 1, 
      name: data.title, 
      pages: [{ id: 1, panels: [] }] 
    }]
    setVolumes(newVolumes)
  }

  const handleCreatePage = (data: { pageNumber: number; pageLayout: string }) => {
    const newVolumes = [...volumes]
    const pages = newVolumes[currentVolume].chapters[currentChapter].pages
    newVolumes[currentVolume].chapters[currentChapter].pages = [...pages, { 
      id: pages.length + 1, 
      panels: [] 
    }]
    setVolumes(newVolumes)
  }

  const handleCreatePanel = (data: { panelNumber: number; sceneDescription: string; dialogue: string; cameraAngle: string }) => {
    const newVolumes = [...volumes]
    const panels = newVolumes[currentVolume].chapters[currentChapter].pages[currentPage].panels
    newVolumes[currentVolume].chapters[currentChapter].pages[currentPage].panels = [...panels, { 
      id: panels.length + 1,
      ...data
    }]
    setVolumes(newVolumes)
  }

  const addVolume = () => {
    openVolumeModal(`第${volumes.length + 1}卷`)
  }

  const addChapter = () => {
    const chapters = volumes[currentVolume]?.chapters || []
    openChapterModal(`第${chapters.length + 1}话`)
  }

  const addPage = () => {
    const pages = volumes[currentVolume]?.chapters[currentChapter]?.pages || []
    openPageModal(pages.length + 1)
  }

  const addPanel = () => {
    const panels = currentPanels || []
    openPanelModal(panels.length + 1)
  }

  const removeTag = (tag: string) => {
    setComicTags(comicTags.filter(t => t !== tag))
  }

  const addPageOld = () => {
    const newVolumes = [...volumes]
    const pages = newVolumes[currentVolume].chapters[currentChapter].pages
    newVolumes[currentVolume].chapters[currentChapter].pages = [...pages, { id: pages.length + 1, panels: [] }]
    setVolumes(newVolumes)
  }

  const currentPages = volumes[currentVolume]?.chapters[currentChapter]?.pages || []
  const currentPanels = currentPages[currentPage]?.panels || []

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 顶部工具栏 */}
      <header className="h-16 bg-indigo-100/50 border-b-2 border-indigo-200 px-6 flex items-center justify-end shadow-sm">
        <div className="flex items-center space-x-3">
          <Button 
            icon={<Save size={16} />}
            className="!bg-white hover:!bg-indigo-50 !text-indigo-600 !rounded-xl !text-sm !font-semibold !border-2 !border-indigo-200 !h-10 !px-4"
          >
            保存草稿
          </Button>
          <Button 
            type="primary"
            icon={<Sparkles size={16} />}
            className="!bg-gradient-to-r !from-indigo-600 !to-purple-600 hover:!from-indigo-700 hover:!to-purple-700 !rounded-xl !text-sm !font-semibold !shadow-lg !h-10 !px-4 !border-0"
          >
            发布作品
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：信息面板 */}
        <aside className="w-72 bg-gradient-to-b from-indigo-50 to-purple-50 border-r-2 border-indigo-200 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* AI 生成 */}
            <div className="bg-white rounded-2xl border-2 border-indigo-200 p-4 shadow-sm">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="text-indigo-600" size={18} />
                <h3 className="text-sm font-bold text-gray-800">AI 智能生成</h3>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="输入创意，AI 自动生成全部内容..."
                className="w-full px-3 py-2 bg-indigo-50/50 border-2 border-indigo-200 rounded-xl text-gray-800 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-400 resize-none"
                rows={3}
              />
              <button
                onClick={() => setIsGenerating(true)}
                disabled={isGenerating || !prompt.trim()}
                className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl text-sm font-semibold transition-all disabled:cursor-not-allowed shadow-md"
              >
                {isGenerating ? '生成中...' : '✨ 一键生成'}
              </button>
            </div>

            {/* 漫画信息 */}
            <div className="bg-white rounded-2xl border-2 border-indigo-200 p-4 shadow-sm">
              <div className="flex items-center space-x-2 mb-3">
                <BookOpen className="text-indigo-600" size={18} />
                <h3 className="text-sm font-bold text-gray-800">漫画信息</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600 font-semibold block mb-1.5">名称</label>
                  <input
                    type="text"
                    value={comicTitle}
                    onChange={(e) => setComicTitle(e.target.value)}
                    placeholder="漫画标题"
                    className="w-full px-3 py-2 bg-indigo-50/50 border-2 border-indigo-200 rounded-xl text-gray-800 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 font-semibold block mb-1.5">描述</label>
                  <textarea
                    value={comicDescription}
                    onChange={(e) => setComicDescription(e.target.value)}
                    placeholder="简要描述"
                    className="w-full px-3 py-2 bg-indigo-50/50 border-2 border-indigo-200 rounded-xl text-gray-800 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-400 resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 font-semibold block mb-1.5">分类</label>
                  <select
                    value={comicCategory}
                    onChange={(e) => setComicCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-indigo-50/50 border-2 border-indigo-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:border-indigo-400"
                  >
                    <option value="">选择分类</option>
                    <option value="热血">热血</option>
                    <option value="恋爱">恋爱</option>
                    <option value="奇幻">奇幻</option>
                    <option value="科幻">科幻</option>
                    <option value="悬疑">悬疑</option>
                    <option value="搞笑">搞笑</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-600 font-semibold block mb-1.5">标签</label>
                  <div className="flex space-x-2">
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value && !comicTags.includes(e.target.value)) {
                          setComicTags([...comicTags, e.target.value])
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-indigo-50/50 border-2 border-indigo-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:border-indigo-400"
                    >
                      <option value="">选择标签</option>
                      <option value="热血">热血</option>
                      <option value="冒险">冒险</option>
                      <option value="恋爱">恋爱</option>
                      <option value="校园">校园</option>
                      <option value="奇幻">奇幻</option>
                      <option value="科幻">科幻</option>
                      <option value="悬疑">悬疑</option>
                      <option value="推理">推理</option>
                      <option value="搞笑">搞笑</option>
                      <option value="日常">日常</option>
                      <option value="治愈">治愈</option>
                      <option value="武侠">武侠</option>
                      <option value="玄幻">玄幻</option>
                      <option value="都市">都市</option>
                      <option value="历史">历史</option>
                    </select>
                  </div>
                  {comicTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {comicTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold"
                        >
                          <span>{tag}</span>
                          <button
                            onClick={() => removeTag(tag)}
                            className="hover:text-indigo-900 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* 中间：卷列表横向网格 */}
        <main className="flex-1 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col p-6">
          {/* 卷列表模块 */}
          <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-lg p-5 mb-4">
            <div className="flex items-center gap-4">
              {/* 左侧标题卡片 */}
              <div className="flex items-center flex-shrink-0">
                {/* 左侧图标 */}
                <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="text-indigo-600" size={28} />
                </div>
                {/* 右侧内容 */}
                <div className="ml-3 flex flex-col">
                  <div className="text-sm font-bold text-gray-800">卷列表</div>
                  <div className="text-xs text-gray-500 mb-1.5">共 {volumes.length} 卷</div>
                  <div className="flex space-x-1.5">
                    <Button 
                      size="small"
                      onClick={addVolume}
                    >
                      创建
                    </Button>
                    <Button 
                      size="small"
                      onClick={() => router.push('/creator/volumes')}
                    >
                      管理
                    </Button>
                  </div>
                </div>
              </div>

              {/* 分隔线 */}
              <div className="w-px h-20 bg-gray-200 flex-shrink-0"></div>

              <div className="flex-1 min-w-0 flex items-center gap-2">
                {/* 左箭头 */}
                <button
                  onClick={() => scroll('left')}
                  className="flex-shrink-0 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* 卷列表滚动区域 */}
                <div className="overflow-hidden" style={{ width: 'calc(100% - 293px)' }}>
                  {/* 卷列表容器 */}
                  <div ref={scrollRef} className="overflow-x-scroll pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="flex space-x-3 min-w-max py-2">
                    {volumes.map((volume, vIdx) => (
                      <div
                        key={volume.id}
                        onClick={() => setCurrentVolume(vIdx)}
                        className={`flex-shrink-0 w-24 h-24 rounded-xl border-2 cursor-pointer transition-all ${
                          currentVolume === vIdx
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-400'
                        }`}
                      >
                        <div className="h-full flex flex-col items-center justify-center p-2">
                          <div className="text-xs font-semibold mb-1">{volume.name}</div>
                          <div className={`text-xs ${currentVolume === vIdx ? 'text-white/70' : 'text-gray-400'}`}>
                            {volume.chapters.length}/{volume.chapters.reduce((sum, ch) => sum + ch.pages.length, 0)}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* 添加卷按钮 */}
                    <button
                      onClick={addVolume}
                      className="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center text-gray-400 hover:text-indigo-600"
                    >
                      <Plus size={24} />
                      <span className="text-xs mt-1">添加卷</span>
                    </button>
                    </div>
                  </div>
                </div>

                {/* 右箭头 */}
                <button
                  onClick={() => scroll('right')}
                  className="flex-shrink-0 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* 话列表模块 */}
          <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-lg p-5 mb-4">
            <div className="flex items-center gap-4">
              {/* 左侧标题卡片 */}
              <div className="flex items-center flex-shrink-0">
                {/* 左侧图标 */}
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="text-purple-600" size={28} />
                </div>
                {/* 右侧内容 */}
                <div className="ml-3 flex flex-col">
                  <div className="text-sm font-bold text-gray-800">{volumes[currentVolume]?.name || '卷'}话列表</div>
                  <div className="text-xs text-gray-500 mb-1.5">共 {volumes[currentVolume]?.chapters.length || 0} 话</div>
                  <div className="flex space-x-1.5">
                    <Button 
                      size="small"
                      onClick={addChapter}
                    >
                      创建
                    </Button>
                    <Button 
                      size="small"
                      onClick={() => router.push('/creator/chapters')}
                    >
                      管理
                    </Button>
                  </div>
                </div>
              </div>

              {/* 分隔线 */}
              {/* 分隔线 */}
              <div className="w-px h-20 bg-gray-200"></div>

              <div className="flex-1 min-w-0 flex items-center gap-2">
                {/* 左箭头 */}
                <button
                  onClick={() => scroll('left')}
                  className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* 话列表滚动区域 */}
                <div className="overflow-hidden" style={{ width: 'calc(100% - 293px)' }}>
                  {/* 话列表容器 */}
                  <div className="flex space-x-3 py-2 overflow-x-scroll scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {volumes[currentVolume]?.chapters.map((chapter, chIdx) => (
                    <div
                      key={chapter.id}
                      onClick={() => setCurrentChapter(chIdx)}
                      className={`flex-shrink-0 w-24 h-24 rounded-xl border-2 cursor-pointer transition-all ${
                        currentChapter === chIdx
                          ? 'bg-purple-600 border-purple-600 text-white shadow-lg'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-purple-400'
                      }`}
                    >
                      <div className="h-full flex flex-col items-center justify-center p-2">
                        <div className="text-xs font-semibold mb-1">{chapter.name}</div>
                        <div className={`text-xs ${currentChapter === chIdx ? 'text-white/70' : 'text-gray-400'}`}>
                          {chapter.pages.length} 页
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* 添加话按钮 */}
                  <button
                    onClick={addChapter}
                    className="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-purple-400 hover:bg-purple-50 transition-all flex flex-col items-center justify-center text-gray-400 hover:text-purple-600"
                  >
                    <Plus size={24} />
                    <span className="text-xs mt-1">添加话</span>
                  </button>
                  </div>
                </div>

                {/* 右箭头 */}
                <button
                  onClick={() => scroll('right')}
                  className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* 页列表模块 */}
          <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-lg p-5 mb-4">
            <div className="flex items-center gap-4">
              {/* 左侧标题卡片 */}
              <div className="flex items-center flex-shrink-0">
                {/* 左侧图标 */}
                <div className="w-16 h-16 bg-pink-100 rounded-xl flex items-center justify-center">
                  <FileText className="text-pink-600" size={28} />
                </div>
                {/* 右侧内容 */}
                <div className="ml-3 flex flex-col">
                  <div className="text-sm font-bold text-gray-800">{volumes[currentVolume]?.chapters[currentChapter]?.name || '话'}页列表</div>
                  <div className="text-xs text-gray-500 mb-1.5">共 {currentPages.length || 0} 页</div>
                  <div className="flex space-x-1.5">
                    <Button 
                      size="small"
                      onClick={addPage}
                    >
                      创建
                    </Button>
                    <Button 
                      size="small"
                      onClick={() => router.push('/creator/pages')}
                    >
                      管理
                    </Button>
                  </div>
                </div>
              </div>

              {/* 分隔线 */}
              {/* 分隔线 */}
              <div className="w-px h-20 bg-gray-200"></div>

              <div className="flex-1 min-w-0 flex items-center gap-2">
                {/* 左箭头 */}
                <button
                  onClick={() => scroll('left')}
                  className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* 页列表滚动区域 */}
                <div className="overflow-hidden" style={{ width: 'calc(100% - 293px)' }}>
                  {/* 页列表容器 */}
                  <div className="flex space-x-3 py-2 overflow-x-scroll scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {currentPages.map((page, pIdx) => (
                    <div
                      key={page.id}
                      onClick={() => setCurrentPage(pIdx)}
                      className={`flex-shrink-0 w-24 h-24 rounded-xl border-2 cursor-pointer transition-all ${
                        currentPage === pIdx
                          ? 'bg-pink-600 border-pink-600 text-white shadow-lg'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-pink-400'
                      }`}
                    >
                      <div className="h-full flex flex-col items-center justify-center p-2">
                        <div className="text-xs font-semibold mb-1">第{pIdx + 1}页</div>
                        <div className={`text-xs ${currentPage === pIdx ? 'text-white/70' : 'text-gray-400'}`}>
                          {page.panels?.length || 0} 格
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* 添加页按钮 */}
                  <button
                    onClick={addPage}
                    className="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-pink-400 hover:bg-pink-50 transition-all flex flex-col items-center justify-center text-gray-400 hover:text-pink-600"
                  >
                    <Plus size={24} />
                    <span className="text-xs mt-1">添加页</span>
                  </button>
                  </div>
                </div>

                {/* 右箭头 */}
                <button
                  onClick={() => scroll('right')}
                  className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* 分镜列表模块 */}
          <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-lg p-5 mb-4">
            <div className="flex items-center gap-4">
              {/* 左侧标题卡片 */}
              <div className="flex items-center flex-shrink-0">
                {/* 左侧图标 */}
                <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Grid className="text-orange-600" size={28} />
                </div>
                {/* 右侧内容 */}
                <div className="ml-3 flex flex-col">
                  <div className="text-sm font-bold text-gray-800">第{currentPage + 1}页分镜列表</div>
                  <div className="text-xs text-gray-500 mb-1.5">共 {currentPanels.length || 0} 格</div>
                  <div className="flex space-x-1.5">
                    <Button 
                      size="small"
                      onClick={addPanel}
                    >
                      创建
                    </Button>
                    <Button 
                      size="small"
                      onClick={() => router.push('/creator/panels')}
                    >
                      管理
                    </Button>
                  </div>
                </div>
              </div>

              {/* 分隔线 */}
              <div className="w-px h-20 bg-gray-200"></div>

              <div className="flex-1 min-w-0 flex items-center gap-2">
                {/* 左箭头 */}
                <button
                  onClick={() => scroll('left')}
                  className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* 分镜列表滚动区域 */}
                <div className="overflow-hidden" style={{ width: 'calc(100% - 293px)' }}>
                  {/* 分镜列表容器 */}
                  <div className="flex space-x-3 py-2 overflow-x-scroll scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {currentPanels.map((panel: any, panelIdx: number) => (
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
                  
                  {/* 添加分镜按钮 */}
                  <button
                    onClick={addPanel}
                    className="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-orange-400 hover:bg-orange-50 transition-all flex flex-col items-center justify-center text-gray-400 hover:text-orange-600"
                  >
                    <Plus size={24} />
                    <span className="text-xs mt-1">添加分镜</span>
                  </button>
                  </div>
                </div>

                {/* 右箭头 */}
                <button
                  onClick={() => scroll('right')}
                  className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <VolumeModal onConfirm={handleCreateVolume} />
      <ChapterModal onConfirm={handleCreateChapter} />
      <PageModal onConfirm={handleCreatePage} />
      <PanelModal onConfirm={handleCreatePanel} />
    </div>
  )
}
