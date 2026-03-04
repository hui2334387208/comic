'use client'

import { useState, useRef, useEffect } from 'react'
import { Save, Sparkles, Plus, X, BookOpen, ChevronLeft, ChevronRight, FileText, Grid } from 'lucide-react'
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
  const [comicStyle, setComicStyle] = useState<number | undefined>(undefined)
  const [comicCategory, setComicCategory] = useState<number | undefined>(undefined)
  const [comicTags, setComicTags] = useState<number[]>([])
  
  // 下拉列表数据
  const [categories, setCategories] = useState<any[]>([])
  const [styles, setStyles] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])

  const loadOptions = async () => {
    try {
      const [categoriesRes, stylesRes, tagsRes] = await Promise.all([
        fetch('/api/creator/categories'),
        fetch('/api/creator/styles'),
        fetch('/api/creator/tags'),
      ])

      const [categoriesData, stylesData, tagsData] = await Promise.all([
        categoriesRes.json(),
        stylesRes.json(),
        tagsRes.json(),
      ])

      if (categoriesData.success) setCategories(categoriesData.data)
      if (stylesData.success) setStyles(stylesData.data)
      if (tagsData.success) setTags(tagsData.data)
    } catch (error) {
      console.error('加载选项失败:', error)
    }
  }
  
  // 加载分类、风格、标签列表
  useEffect(() => {
    loadOptions()
  }, [])
  
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

  // 重新生成标题
  const handleRegenerateTitle = async () => {
    if (!prompt.trim()) {
      alert('请先输入创意内容')
      return
    }
    setIsGenerating(true)
    try {
      const response = await fetch('/api/creator/generate/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), model: 'deepseek-chat', language: 'zh' }),
      })
      const data = await response.json()
      if (data.success && data.data?.title) {
        setComicTitle(data.data.title)
      }
    } catch (error) {
      console.error('生成失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // 重新生成描述
  const handleRegenerateDescription = async () => {
    if (!prompt.trim()) {
      alert('请先输入创意内容')
      return
    }
    setIsGenerating(true)
    try {
      const response = await fetch('/api/creator/generate/description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), title: comicTitle, model: 'deepseek-chat', language: 'zh' }),
      })
      const data = await response.json()
      if (data.success && data.data?.description) {
        setComicDescription(data.data.description)
      }
    } catch (error) {
      console.error('生成失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // 重新生成风格
  const handleRegenerateStyle = async () => {
    if (!prompt.trim()) {
      alert('请先输入创意内容')
      return
    }
    setIsGenerating(true)
    try {
      const response = await fetch('/api/creator/generate/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), title: comicTitle, description: comicDescription, model: 'deepseek-chat', language: 'zh' }),
      })
      const data = await response.json()
      if (data.success && data.data?.style) {
        const style = data.data.style
        const styleWriteResponse = await fetch('/api/creator/styles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(style),
        })
        const styleWriteData = await styleWriteResponse.json()
        if (styleWriteData.success && styleWriteData.data?.id) {
          setComicStyle(styleWriteData.data.id)
          await loadOptions()
        }
      }
    } catch (error) {
      console.error('生成失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // 重新生成分类
  const handleRegenerateCategory = async () => {
    if (!prompt.trim()) {
      alert('请先输入创意内容')
      return
    }
    setIsGenerating(true)
    try {
      const response = await fetch('/api/creator/generate/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), title: comicTitle, description: comicDescription, model: 'deepseek-chat', language: 'zh' }),
      })
      const data = await response.json()
      if (data.success && data.data?.category) {
        const category = data.data.category
        const categoryWriteResponse = await fetch('/api/creator/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(category),
        })
        const categoryWriteData = await categoryWriteResponse.json()
        if (categoryWriteData.success && categoryWriteData.data?.id) {
          setComicCategory(categoryWriteData.data.id)
          await loadOptions()
        }
      }
    } catch (error) {
      console.error('生成失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // 重新生成标签
  const handleRegenerateTags = async () => {
    if (!prompt.trim()) {
      alert('请先输入创意内容')
      return
    }
    setIsGenerating(true)
    try {
      const response = await fetch('/api/creator/generate/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), title: comicTitle, description: comicDescription, category: comicCategory, model: 'deepseek-chat', language: 'zh' }),
      })
      const data = await response.json()
      if (data.success && data.data?.tags) {
        const tags = data.data.tags
        const tagsWriteResponse = await fetch('/api/creator/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags }),
        })
        const tagsWriteData = await tagsWriteResponse.json()
        if (tagsWriteData.success && tagsWriteData.data) {
          setComicTags(tagsWriteData.data.map((tag: any) => tag.id))
          await loadOptions()
        }
      }
    } catch (error) {
      console.error('生成失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // 处理标题变化
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setComicTitle(e.target.value)
  }

  // 处理描述变化
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComicDescription(e.target.value)
  }

  // 处理提示词变化
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value)
  }

  // 处理风格变化
  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setComicStyle(e.target.value ? Number(e.target.value) : undefined)
  }

  // 处理分类变化
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setComicCategory(e.target.value ? Number(e.target.value) : undefined)
  }

  // 处理标签选择
  const handleTagSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => Number(option.value))
    setComicTags(selectedOptions)
  }

  // 移除标签
  const handleRemoveTag = (tagId: number) => {
    setComicTags(comicTags.filter(id => id !== tagId))
  }

  // AI 一键生成漫画元数据
  const handleAIGenerate = async () => {
      if (!prompt.trim()) {
        alert('请输入创意内容')
        return
      }

      setIsGenerating(true)

      try {
        const promptText = prompt.trim()
        const requestBody = {
          prompt: promptText,
          model: 'deepseek-chat',
          language: 'zh'
        }

        // 1. 生成标题
        const titleResponse = await fetch('/api/creator/generate/title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })
        const titleData = await titleResponse.json()
        if (titleData.success && titleData.data?.title) {
          setComicTitle(titleData.data.title)
        }

        // 2. 生成描述
        const descResponse = await fetch('/api/creator/generate/description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...requestBody, title: titleData.data?.title }),
        })
        const descData = await descResponse.json()
        if (descData.success && descData.data?.description) {
          setComicDescription(descData.data.description)
        }

        // 3. 生成风格
        const styleResponse = await fetch('/api/creator/generate/style', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...requestBody, title: titleData.data?.title, description: descData.data?.description }),
        })
        const styleData = await styleResponse.json()
        if (styleData.success && styleData.data?.style) {
          const style = styleData.data.style
          const styleWriteResponse = await fetch('/api/creator/styles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(style),
          })
          const styleWriteData = await styleWriteResponse.json()
          if (styleWriteData.success && styleWriteData.data?.id) {
            setComicStyle(styleWriteData.data.id)
            await loadOptions() // 重新加载选项列表
          }
        }

        // 4. 生成分类
        const categoryResponse = await fetch('/api/creator/generate/category', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...requestBody, title: titleData.data?.title, description: descData.data?.description }),
        })
        const categoryData = await categoryResponse.json()
        if (categoryData.success && categoryData.data?.category) {
          const category = categoryData.data.category
          const categoryWriteResponse = await fetch('/api/creator/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(category),
          })
          const categoryWriteData = await categoryWriteResponse.json()
          if (categoryWriteData.success && categoryWriteData.data?.id) {
            setComicCategory(categoryWriteData.data.id)
            await loadOptions() // 重新加载选项列表
          }
        }

        // 5. 生成标签
        const tagsResponse = await fetch('/api/creator/generate/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...requestBody, 
            title: titleData.data?.title, 
            description: descData.data?.description,
            category: categoryData.data?.category?.name
          }),
        })
        const tagsData = await tagsResponse.json()
        if (tagsData.success && tagsData.data?.tags) {
          const tags = tagsData.data.tags
          const tagsWriteResponse = await fetch('/api/creator/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tags }),
          })
          const tagsWriteData = await tagsWriteResponse.json()
          if (tagsWriteData.success && tagsWriteData.data) {
            setComicTags(tagsWriteData.data.map((tag: any) => tag.id))
            await loadOptions() // 重新加载选项列表
          }
        }

        alert('生成成功！请检查并完善漫画信息')
      } catch (error: any) {
        console.error('AI生成失败:', error)
        alert(error.message || 'AI生成失败，请重试')
      } finally {
        setIsGenerating(false)
      }
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
          <button 
            className="bg-white hover:bg-indigo-50 text-indigo-600 rounded-xl text-sm font-semibold border-2 border-indigo-200 h-10 px-4 flex items-center gap-2 transition-colors"
          >
            <Save size={16} />
            保存草稿
          </button>
          <button 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl text-sm font-semibold shadow-lg h-10 px-4 border-0 text-white flex items-center gap-2 transition-all"
          >
            <Sparkles size={16} />
            发布作品
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：信息面板 */}
        <aside className="w-[350px] bg-gradient-to-b from-indigo-50 to-purple-50 border-r-2 border-indigo-200 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* AI 生成 */}
            <div className="bg-white rounded-2xl border-2 border-indigo-200 p-4 shadow-sm">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="text-indigo-600" size={18} />
                <h3 className="text-sm font-bold text-gray-800">AI 智能生成</h3>
              </div>
              <textarea
                value={prompt}
                onChange={handlePromptChange}
                placeholder="输入创意，AI 自动生成全部内容..."
                className="w-full px-3 py-2 bg-indigo-50/50 border-2 border-indigo-200 rounded-xl text-gray-800 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-400 resize-none"
                rows={3}
              />
              <button
                onClick={handleAIGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={comicTitle}
                      onChange={handleTitleChange}
                      placeholder="漫画标题"
                      disabled={!prompt.trim() || isGenerating}
                      className="flex-1 px-3 py-2 bg-indigo-50/50 border-2 border-indigo-200 rounded-xl text-gray-800 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={handleRegenerateTitle}
                      disabled={!prompt.trim() || isGenerating}
                      className="w-9 h-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-600 font-semibold block mb-1.5">描述</label>
                  <div className="flex gap-2">
                    <textarea
                      value={comicDescription}
                      onChange={handleDescriptionChange}
                      placeholder="简要描述"
                      disabled={!prompt.trim() || isGenerating}
                      className="flex-1 px-3 py-2 bg-indigo-50/50 border-2 border-indigo-200 rounded-xl text-gray-800 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-400 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      rows={2}
                    />
                    <button
                      onClick={handleRegenerateDescription}
                      disabled={!prompt.trim() || isGenerating}
                      className="w-9 h-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all self-start disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-600 font-semibold block mb-1.5">风格</label>
                  <div className="flex gap-2">
                    <select
                      value={comicStyle || ''}
                      onChange={handleStyleChange}
                      disabled={!prompt.trim() || isGenerating}
                      className="flex-1 px-3 py-2 bg-indigo-50/50 border-2 border-indigo-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">选择风格</option>
                      {styles.map((style) => (
                        <option key={style.id} value={style.id}>
                          {style.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleRegenerateStyle}
                      disabled={!prompt.trim() || isGenerating}
                      className="w-9 h-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-600 font-semibold block mb-1.5">分类</label>
                  <div className="flex gap-2">
                    <select
                      value={comicCategory || ''}
                      onChange={handleCategoryChange}
                      disabled={!prompt.trim() || isGenerating}
                      className="flex-1 px-3 py-2 bg-indigo-50/50 border-2 border-indigo-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">选择分类</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleRegenerateCategory}
                      disabled={!prompt.trim() || isGenerating}
                      className="w-9 h-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-600 font-semibold block mb-1.5">标签</label>
                  <div className="flex gap-2">
                    <select
                      value={comicTags.map(String)}
                      onChange={handleTagSelect}
                      disabled={!prompt.trim() || isGenerating}
                      className="flex-1 px-3 py-2 bg-indigo-50/50 border-2 border-indigo-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {tags.map((tag) => (
                        <option key={tag.id} value={tag.id}>
                          {tag.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleRegenerateTags}
                      disabled={!prompt.trim() || isGenerating}
                      className="w-9 h-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles size={16} />
                    </button>
                  </div>
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
                    <button 
                      onClick={addVolume}
                      className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      创建
                    </button>
                    <button 
                      onClick={() => router.push('/creator/volumes')}
                      className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      管理
                    </button>
                  </div>
                </div>
              </div>

              {/* 分隔线 */}
              <div className="w-px h-20 bg-gray-200 flex-shrink-0"></div>

              <div className="flex-1 min-w-0 flex items-center gap-2">
                {/* 左箭头 */}
                <button
                  onClick={() => scroll('left')}
                  className="flex-shrink-0 w-8 h-8 min-w-[32px] p-0 bg-white rounded-full shadow text-gray-600 hover:bg-gray-50 border-0 flex items-center justify-center transition-colors"
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
                      className="flex-shrink-0 w-24 h-24 min-w-[96px] rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 flex flex-col items-center justify-center p-0 transition-all"
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
                  className="flex-shrink-0 w-8 h-8 min-w-[32px] p-0 bg-white rounded-full shadow text-gray-600 hover:bg-gray-50 border-0 flex items-center justify-center transition-colors"
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
                    <button 
                      onClick={addChapter}
                      className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      创建
                    </button>
                    <button 
                      onClick={() => router.push('/creator/chapters')}
                      className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      管理
                    </button>
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
                  className="w-8 h-8 min-w-[32px] p-0 bg-white rounded-full shadow text-gray-600 hover:bg-gray-50 border-0 flex items-center justify-center transition-colors"
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
                    className="flex-shrink-0 w-24 h-24 min-w-[96px] rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-purple-400 hover:bg-purple-50 text-gray-400 hover:text-purple-600 flex flex-col items-center justify-center p-0 transition-all"
                  >
                    <Plus size={24} />
                    <span className="text-xs mt-1">添加话</span>
                  </button>
                  </div>
                </div>

                {/* 右箭头 */}
                <button
                  onClick={() => scroll('right')}
                  className="w-8 h-8 min-w-[32px] p-0 bg-white rounded-full shadow text-gray-600 hover:bg-gray-50 border-0 flex items-center justify-center transition-colors"
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
                    <button 
                      onClick={addPage}
                      className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      创建
                    </button>
                    <button 
                      onClick={() => router.push('/creator/pages')}
                      className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      管理
                    </button>
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
                  className="w-8 h-8 min-w-[32px] p-0 bg-white rounded-full shadow text-gray-600 hover:bg-gray-50 border-0 flex items-center justify-center transition-colors"
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
                    className="flex-shrink-0 w-24 h-24 min-w-[96px] rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-pink-400 hover:bg-pink-50 text-gray-400 hover:text-pink-600 flex flex-col items-center justify-center p-0 transition-all"
                  >
                    <Plus size={24} />
                    <span className="text-xs mt-1">添加页</span>
                  </button>
                  </div>
                </div>

                {/* 右箭头 */}
                <button
                  onClick={() => scroll('right')}
                  className="w-8 h-8 min-w-[32px] p-0 bg-white rounded-full shadow text-gray-600 hover:bg-gray-50 border-0 flex items-center justify-center transition-colors"
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
                    <button 
                      onClick={addPanel}
                      className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      创建
                    </button>
                    <button 
                      onClick={() => router.push('/creator/panels')}
                      className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      管理
                    </button>
                  </div>
                </div>
              </div>

              {/* 分隔线 */}
              <div className="w-px h-20 bg-gray-200"></div>

              <div className="flex-1 min-w-0 flex items-center gap-2">
                {/* 左箭头 */}
                <button
                  onClick={() => scroll('left')}
                  className="w-8 h-8 min-w-[32px] p-0 bg-white rounded-full shadow text-gray-600 hover:bg-gray-50 border-0 flex items-center justify-center transition-colors"
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
                    className="flex-shrink-0 w-24 h-24 min-w-[96px] rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-orange-400 hover:bg-orange-50 text-gray-400 hover:text-orange-600 flex flex-col items-center justify-center p-0 transition-all"
                  >
                    <Plus size={24} />
                    <span className="text-xs mt-1">添加分镜</span>
                  </button>
                  </div>
                </div>

                {/* 右箭头 */}
                <button
                  onClick={() => scroll('right')}
                  className="w-8 h-8 min-w-[32px] p-0 bg-white rounded-full shadow text-gray-600 hover:bg-gray-50 border-0 flex items-center justify-center transition-colors"
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
