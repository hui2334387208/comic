'use client'

import { useState } from 'react'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from 'antd'
import { useRouter } from 'next/navigation'
import PageModal from '@/components/creator/PageModal'
import { usePageModalStore } from '@/store/creator/pageStore'

export default function PagesManagePage() {
  const router = useRouter()
  const { open: openPageModal } = usePageModalStore()
  
  // 临时数据，实际应该从API或状态管理获取
  const [pages, setPages] = useState([
    { id: 1, pageNumber: 1, pageLayout: '标准布局', panels: [] }
  ])
  const [selectedPageIndex, setSelectedPageIndex] = useState(0)

  const handleUpdatePage = (index: number, data: { pageNumber: number; pageLayout: string }) => {
    const newPages = [...pages]
    newPages[index] = { ...newPages[index], pageNumber: data.pageNumber, pageLayout: data.pageLayout }
    setPages(newPages)
  }

  const handleCreatePage = (data: { pageNumber: number; pageLayout: string }) => {
    setPages([...pages, { 
      id: pages.length + 1, 
      pageNumber: data.pageNumber,
      pageLayout: data.pageLayout,
      panels: [] 
    }])
  }

  const addPage = () => {
    openPageModal(pages.length + 1)
  }

  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      alert('至少需要保留一个页')
      return
    }
    const newPages = pages.filter((_, i) => i !== index)
    setPages(newPages)
    if (selectedPageIndex >= newPages.length) {
      setSelectedPageIndex(newPages.length - 1)
    }
  }

  const selectedPage = pages[selectedPageIndex]

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
              <Button size="small" onClick={addPage}>
                <Plus size={14} className="mr-1" />
                新建
              </Button>
            </div>
            <div className="space-y-2">
              {pages.map((page, index) => (
                <div
                  key={page.id}
                  className={`group relative p-4 rounded-xl cursor-pointer transition-all ${
                    selectedPageIndex === index
                      ? 'bg-pink-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-pink-50'
                  }`}
                >
                  <div onClick={() => setSelectedPageIndex(index)}>
                    <div className="font-semibold text-sm mb-1">第{page.pageNumber}页</div>
                    <div className={`text-xs ${selectedPageIndex === index ? 'text-white/70' : 'text-gray-500'}`}>
                      {page.pageLayout}
                    </div>
                    <div className={`text-xs mt-1 ${selectedPageIndex === index ? 'text-white/70' : 'text-gray-400'}`}>
                      {page.panels?.length || 0} 格
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deletePage(index)
                    }}
                    className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all ${
                      selectedPageIndex === index
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
                value={selectedPage?.pageNumber || 1}
                onChange={(e) => handleUpdatePage(selectedPageIndex, { 
                  pageNumber: parseInt(e.target.value) || 1,
                  pageLayout: selectedPage?.pageLayout || ''
                })}
                placeholder="页码"
                className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 font-semibold block mb-2">页面布局</label>
              <select
                value={selectedPage?.pageLayout || ''}
                onChange={(e) => handleUpdatePage(selectedPageIndex, { 
                  pageNumber: selectedPage?.pageNumber || 1,
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

      <PageModal onConfirm={handleCreatePage} />
    </div>
  )
}
