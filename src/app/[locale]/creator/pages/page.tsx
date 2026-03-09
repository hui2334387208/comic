'use client'

import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useComicCreateStore } from '@/store/creator/comicCreateStore'
import { globalMessage } from '@/components/common/GlobalMessage'

export default function PagesManagePage() {
  const router = useRouter()
  
  const { 
    episodes, 
    currentEpisode, 
    currentPage, 
    setCurrentPage, 
    addPage, 
    updatePage, 
    deletePage,
    comicInfo
  } = useComicCreateStore()
  
  const currentEpisodeData = episodes[currentEpisode]
  const pages = currentEpisodeData?.pages || []

  const handleUpdatePage = (index: number, data: { pageNumber: number; pageLayout: string }) => {
    updatePage(currentEpisode, index, {
      pageLayout: data.pageLayout
    })
  }

  const handleAddPage = () => {
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
    if (!currentEpisodeData) {
      globalMessage.warning('请先创建一个话')
      return
    }
    
    const pageNumber = pages.length + 1
    addPage(currentEpisode, { 
      id: pageNumber,
      pageLayout: '',
      panels: [] 
    })
    setCurrentPage(pages.length)
  }

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) {
      globalMessage.warning('至少需要保留一个页')
      return
    }
    deletePage(currentEpisode, index)
  }

  const selectedPage = pages[currentPage]

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
        {/* 左侧：页列表 */}
        <aside className="w-80 bg-gradient-to-b from-indigo-50 to-purple-50 border-r-2 border-indigo-200 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">页列表</h2>
              <button
                onClick={handleAddPage}
                className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md flex items-center gap-1"
              >
                <Plus size={16} />
                添加页
              </button>
            </div>
            <div className="space-y-2">
              {pages.map((page, index) => (
                <div
                  key={page.id}
                  className={`group relative p-4 rounded-xl cursor-pointer transition-all ${
                    currentPage === index
                      ? 'bg-pink-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-pink-50'
                  }`}
                >
                  <div onClick={() => setCurrentPage(index)}>
                    <div className="font-semibold text-sm mb-1">第{index + 1}页</div>
                    <div className={`text-xs ${currentPage === index ? 'text-white/70' : 'text-gray-500'}`}>
                      {page.pageLayout || '未设置布局'}
                    </div>
                    <div className={`text-xs mt-1 ${currentPage === index ? 'text-white/70' : 'text-gray-400'}`}>
                      {page.panels?.length || 0} 格
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePage(index)
                    }}
                    className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all ${
                      currentPage === index
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

        {/* 右侧：页表单 */}
        <main className="flex-1 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-700 font-semibold block mb-2">页码</label>
              <input
                type="number"
                value={currentPage + 1}
                disabled
                placeholder="页码"
                className="w-full px-4 py-3 bg-gray-100 border-2 border-indigo-200 rounded-xl text-gray-800 placeholder-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 font-semibold block mb-2">页面布局</label>
              <select
                value={selectedPage?.pageLayout || ''}
                onChange={(e) => handleUpdatePage(currentPage, { 
                  pageNumber: currentPage + 1,
                  pageLayout: e.target.value
                })}
                className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-gray-800 focus:outline-none focus:border-indigo-400"
              >
                <option value="">选择布局</option>
                <option value="标准布局">标准布局</option>
                <option value="单格大图">单格大图</option>
                <option value="双格横排">双格横排</option>
                <option value="三格竖排">三格竖排</option>
                <option value="四格田字">四格田字</option>
                <option value="自由布局">自由布局</option>
              </select>
            </div>

            <div className="pt-4 border-t border-gray-300">
              <div className="text-sm text-gray-600">
                {selectedPage?.panels?.length || 0} 格
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
