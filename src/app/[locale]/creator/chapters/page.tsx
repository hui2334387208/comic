'use client'

import { useState } from 'react'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from 'antd'
import { useRouter } from 'next/navigation'
import ChapterModal from '@/components/creator/ChapterModal'
import { useChapterModalStore } from '@/store/creator/chapterStore'

export default function ChaptersManagePage() {
  const router = useRouter()
  const { open: openChapterModal } = useChapterModalStore()
  
  // 临时数据，实际应该从API或状态管理获取
  const [chapters, setChapters] = useState([
    { id: 1, name: '第1话', title: '初次相遇', description: '故事的开端...', pages: [{ id: 1, panels: [] }] }
  ])
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0)

  const handleUpdateChapter = (index: number, data: { title: string; description: string }) => {
    const newChapters = [...chapters]
    newChapters[index] = { ...newChapters[index], name: data.title, title: data.title, description: data.description }
    setChapters(newChapters)
  }

  const handleCreateChapter = (data: { title: string; description: string }) => {
    setChapters([...chapters, { 
      id: chapters.length + 1, 
      name: data.title,
      title: data.title,
      description: data.description,
      pages: [{ id: 1, panels: [] }] 
    }])
  }

  const addChapter = () => {
    openChapterModal(`第${chapters.length + 1}话`)
  }

  const deleteChapter = (index: number) => {
    if (chapters.length <= 1) {
      alert('至少需要保留一个话')
      return
    }
    const newChapters = chapters.filter((_, i) => i !== index)
    setChapters(newChapters)
    if (selectedChapterIndex >= newChapters.length) {
      setSelectedChapterIndex(newChapters.length - 1)
    }
  }

  const selectedChapter = chapters[selectedChapterIndex]

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 顶部工具栏 */}
      <header className="h-16 bg-indigo-100/50 border-b-2 border-indigo-200 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-white hover:bg-indigo-50 text-indigo-600 rounded-xl transition-all text-sm font-semibold border-2 border-indigo-200"
          >
            <ChevronLeft size={16} className="inline mr-1" />
            返回
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：话列表 */}
        <aside className="w-80 bg-gradient-to-b from-indigo-50 to-purple-50 border-r-2 border-indigo-200 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">话列表</h2>
              <Button size="small" onClick={addChapter}>
                <Plus size={14} className="mr-1" />
                新建
              </Button>
            </div>
            <div className="space-y-2">
              {chapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  className={`group relative p-4 rounded-xl cursor-pointer transition-all ${
                    selectedChapterIndex === index
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-purple-50'
                  }`}
                >
                  <div onClick={() => setSelectedChapterIndex(index)}>
                    <div className="font-semibold text-sm mb-1">{chapter.name}</div>
                    <div className={`text-xs ${selectedChapterIndex === index ? 'text-white/70' : 'text-gray-500'}`}>
                      {chapter.title || '未设置标题'}
                    </div>
                    <div className={`text-xs mt-1 ${selectedChapterIndex === index ? 'text-white/70' : 'text-gray-400'}`}>
                      {chapter.pages.length} 页
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteChapter(index)
                    }}
                    className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all ${
                      selectedChapterIndex === index
                        ? 'bg-white/20 hover:bg-white/30 text-white'
                        : 'bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* 右侧：话表单 */}
        <main className="flex-1 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-700 font-semibold block mb-2">话标题</label>
              <input
                type="text"
                value={selectedChapter?.title || ''}
                onChange={(e) => handleUpdateChapter(selectedChapterIndex, { 
                  title: e.target.value,
                  description: selectedChapter?.description || ''
                })}
                placeholder="例如：初次相遇"
                className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 font-semibold block mb-2">话描述</label>
              <textarea
                value={selectedChapter?.description || ''}
                onChange={(e) => handleUpdateChapter(selectedChapterIndex, { 
                  title: selectedChapter?.title || '',
                  description: e.target.value
                })}
                placeholder="简要描述这一话的内容..."
                className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-indigo-400 resize-none"
                rows={6}
              />
            </div>

            <div className="pt-4 border-t border-gray-300">
              <div className="text-sm text-gray-600">
                {selectedChapter?.pages.length} 页
              </div>
            </div>
          </div>
        </main>
      </div>

      <ChapterModal onConfirm={handleCreateChapter} />
    </div>
  )
}
