'use client'

import { Save, Sparkles, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { globalMessage } from '@/components/common/GlobalMessage'
import { useComicCreateStore } from '@/store/creator/comicCreateStore'
import ComicInfoPanel from '@/components/creator/ComicInfoPanel'
import EpisodeList from '@/components/creator/EpisodeList'
import PageList from '@/components/creator/PageList'
import PanelList from '@/components/creator/PanelList'
import VolumeModal from '@/components/creator/VolumeModal'
import ChapterModal from '@/components/creator/ChapterModal'
import PageModal from '@/components/creator/PageModal'
import PanelModal from '@/components/creator/PanelModal'
import { useVolumeModalStore } from '@/store/creator/volumeStore'
import { useChapterModalStore } from '@/store/creator/chapterStore'
import { usePageModalStore } from '@/store/creator/pageStore'
import { usePanelModalStore } from '@/store/creator/panelStore'
import { useState } from 'react'

export default function CreatePage() {
  const router = useRouter()
  const { open: openVolumeModal } = useVolumeModalStore()
  const { open: openChapterModal } = useChapterModalStore()
  const { open: openPageModal } = usePageModalStore()
  const { open: openPanelModal } = usePanelModalStore()
  
  const {
    comicInfo,
    episodes,
    currentEpisode,
    currentPage,
    isGenerating,
    setIsGenerating,
  } = useComicCreateStore()

  const [volumes] = useState([{ id: 1, name: '第1卷', title: '', description: '', coverImage: '', chapters: [{ id: 1, name: '第1话', pages: [{ id: 1, panels: [] }] }] }])
  const [styles, setStyles] = useState<any[]>([])

  const handleCreateVolume = (data: { name: string; title: string; description: string; coverImage: string }) => {
    // TODO: 卷功能暂时注释
  }

  const handleCreateChapter = (data: { title: string; description: string }) => {
    // TODO: 使用 store 管理
  }

  const handleCreatePage = (data: { pageNumber: number; pageLayout: string }) => {
    // TODO: 使用 store 管理
  }

  const handleCreatePanel = (data: { panelNumber: number; sceneDescription: string; dialogue: string; cameraAngle: string }) => {
    // TODO: 使用 store 管理
  }

  // 生成漫画（封面 + 分镜图片）
  const handleGenerateComic = async () => {
    if (!comicInfo.title || !comicInfo.description || !comicInfo.style) {
      globalMessage.warning('请先完善漫画信息（标题、描述、风格）')
      return
    }

    const currentEp = episodes[currentEpisode]
    if (!currentEp) {
      globalMessage.warning('请先创建一个话')
      return
    }

    if (currentEp.pages.length === 0) {
      globalMessage.warning('请先创建页')
      return
    }

    const allPanels = currentEp.pages.flatMap(page => page.panels)
    if (allPanels.length === 0) {
      globalMessage.warning('请先创建分镜')
      return
    }

    setIsGenerating(true)

    try {
      // 加载风格数据
      if (styles.length === 0) {
        const stylesRes = await fetch('/api/creator/styles')
        const stylesData = await stylesRes.json()
        if (stylesData.success) setStyles(stylesData.data)
      }

      // 1. 生成封面图片
      const coverResponse = await fetch('/api/creator/generate/cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: comicInfo.title,
          description: comicInfo.description,
          style: styles.find(s => s.id === comicInfo.style)?.slug || 'anime'
        }),
      })

      const coverData = await coverResponse.json()
      if (coverData.success) {
        console.log('封面生成成功:', coverData.data.coverUrl)
      } else {
        console.warn('封面生成失败:', coverData.error)
      }

      // 2. 生成漫画图片 - 传递完整的话-页-分镜嵌套结构
      const imagesResponse = await fetch('/api/creator/generate/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episode: currentEp,
          style: styles.find(s => s.id === comicInfo.style)?.slug || 'anime'
        }),
      })

      const imagesData = await imagesResponse.json()
      if (imagesData.success) {
        console.log(`成功生成${imagesData.data?.successCount}张图片`)
        globalMessage.success('漫画生成成功！')
      } else {
        throw new Error(imagesData.error || '图片生成失败')
      }

    } catch (error) {
      console.error('生成漫画失败:', error)
      globalMessage.error(error instanceof Error ? error.message : '生成失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 顶部工具栏 */}
      <header className="h-16 bg-indigo-100/50 border-b-2 border-indigo-200 px-6 flex items-center justify-end shadow-sm">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              globalMessage.info('预览功能开发中')
            }}
            className="bg-white hover:bg-indigo-50 text-indigo-600 rounded-xl text-sm font-semibold border-2 border-indigo-200 h-10 px-4 flex items-center gap-2 transition-colors"
          >
            <BookOpen size={16} />
            预览
          </button>
          <button 
            onClick={handleGenerateComic}
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-sm font-semibold shadow-lg h-10 px-4 border-0 text-white flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={16} />
            {isGenerating ? '生成中...' : '生成漫画'}
          </button>
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
        <ComicInfoPanel />

        {/* 中间：话、页、分镜列表 */}
        <main className="flex-1 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col p-6">
          <EpisodeList />
          <PageList />
          <PanelList />
        </main>
      </div>

      <VolumeModal onConfirm={handleCreateVolume} />
      <ChapterModal onConfirm={handleCreateChapter} />
      <PageModal onConfirm={handleCreatePage} />
      <PanelModal onConfirm={handleCreatePanel} />
    </div>
  )
}
