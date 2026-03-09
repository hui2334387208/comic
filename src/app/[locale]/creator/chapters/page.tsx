'use client'

import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useComicCreateStore } from '@/store/creator/comicCreateStore'
import { globalMessage } from '@/components/common/GlobalMessage'

export default function ChaptersManagePage() {
  const router = useRouter()
  
  const { 
    episodes, 
    currentEpisode, 
    setCurrentEpisode, 
    addEpisode, 
    updateEpisode, 
    deleteEpisode,
    comicInfo
  } = useComicCreateStore()

  const handleUpdateChapter = (index: number, data: { title: string; description: string }) => {
    updateEpisode(index, {
      name: data.title,
      description: data.description
    })
  }

  const addChapter = () => {
    if (!comicInfo.prompt?.trim()) {
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
    addEpisode({ 
      id: episodeNumber, 
      name: `第${episodeNumber}话`,
      description: '',
      pages: []
    })
    setCurrentEpisode(episodes.length)
  }

  const deleteChapter = (index: number) => {
    if (episodes.length <= 1) {
      globalMessage.warning('至少需要保留一个话')
      return
    }
    deleteEpisode(index)
  }

  const selectedChapter = episodes[currentEpisode]

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
              <button
                onClick={addChapter}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md flex items-center gap-1"
              >
                <Plus size={16} />
                新建话
              </button>
            </div>
            <div className="space-y-2">
              {episodes.map((chapter, index) => (
                <div
                  key={chapter.id}
                  className={`group relative p-4 rounded-xl cursor-pointer transition-all ${
                    currentEpisode === index
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-purple-50'
                  }`}
                >
                  <div onClick={() => setCurrentEpisode(index)}>
                    <div className="font-semibold text-sm mb-1">{chapter.name}</div>
                    <div className={`text-xs ${currentEpisode === index ? 'text-white/70' : 'text-gray-500'}`}>
                      {chapter.description || '未设置描述'}
                    </div>
                    <div className={`text-xs mt-1 ${currentEpisode === index ? 'text-white/70' : 'text-gray-400'}`}>
                      {chapter.pages.length} 页
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteChapter(index)
                    }}
                    className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all ${
                      currentEpisode === index
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
                value={selectedChapter?.name || ''}
                onChange={(e) => handleUpdateChapter(currentEpisode, { 
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
                onChange={(e) => handleUpdateChapter(currentEpisode, { 
                  title: selectedChapter?.name || '',
                  description: e.target.value
                })}
                placeholder="简要描述这一话的内容..."
                className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-indigo-400 resize-none"
                rows={6}
              />
            </div>

            <div className="pt-4 border-t border-gray-300">
              <div className="text-sm text-gray-600">
                {selectedChapter?.pages?.length || 0} 页
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
