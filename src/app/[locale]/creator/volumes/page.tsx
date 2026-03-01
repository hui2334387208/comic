'use client'

import { useState } from 'react'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from 'antd'
import { useRouter } from 'next/navigation'
import VolumeModal from '@/components/creator/VolumeModal'
import { useVolumeModalStore } from '@/store/creator/volumeStore'

export default function VolumesManagePage() {
  const router = useRouter()
  const { open: openVolumeModal } = useVolumeModalStore()
  
  // 临时数据，实际应该从API或状态管理获取
  const [volumes, setVolumes] = useState([
    { id: 1, name: '第1卷', title: '新的开始', description: '故事的开端...', coverImage: '', chapters: [{ id: 1, name: '第1话', pages: [{ id: 1, panels: [] }] }] }
  ])
  const [selectedVolumeIndex, setSelectedVolumeIndex] = useState(0)

  const handleUpdateVolume = (index: number, data: { name: string; title: string; description: string; coverImage: string }) => {
    const newVolumes = [...volumes]
    newVolumes[index] = { ...newVolumes[index], ...data }
    setVolumes(newVolumes)
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

  const addVolume = () => {
    openVolumeModal(`第${volumes.length + 1}卷`)
  }

  const deleteVolume = (index: number) => {
    if (volumes.length <= 1) {
      alert('至少需要保留一个卷')
      return
    }
    const newVolumes = volumes.filter((_, i) => i !== index)
    setVolumes(newVolumes)
    if (selectedVolumeIndex >= newVolumes.length) {
      setSelectedVolumeIndex(newVolumes.length - 1)
    }
  }

  const selectedVolume = volumes[selectedVolumeIndex]

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
        {/* 左侧：卷列表 */}
        <aside className="w-80 bg-gradient-to-b from-indigo-50 to-purple-50 border-r-2 border-indigo-200 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">卷列表</h2>
              <Button size="small" onClick={addVolume}>
                <Plus size={14} className="mr-1" />
                新建
              </Button>
            </div>
            <div className="space-y-2">
              {volumes.map((volume, index) => (
                <div
                  key={volume.id}
                  className={`group relative p-4 rounded-xl cursor-pointer transition-all ${
                    selectedVolumeIndex === index
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-indigo-50'
                  }`}
                >
                  <div onClick={() => setSelectedVolumeIndex(index)}>
                    <div className="font-semibold text-sm mb-1">{volume.name}</div>
                    <div className={`text-xs ${selectedVolumeIndex === index ? 'text-white/70' : 'text-gray-500'}`}>
                      {volume.title || '未设置标题'}
                    </div>
                    <div className={`text-xs mt-1 ${selectedVolumeIndex === index ? 'text-white/70' : 'text-gray-400'}`}>
                      {volume.chapters.length} 话 · {volume.chapters.reduce((sum, ch) => sum + ch.pages.length, 0)} 页
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteVolume(index)
                    }}
                    className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all ${
                      selectedVolumeIndex === index
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

        {/* 右侧：卷表单 */}
        <main className="flex-1 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-700 font-semibold block mb-2">卷名称</label>
              <input
                type="text"
                value={selectedVolume?.name || ''}
                onChange={(e) => handleUpdateVolume(selectedVolumeIndex, { 
                  name: e.target.value,
                  title: selectedVolume?.title || '',
                  description: selectedVolume?.description || '',
                  coverImage: selectedVolume?.coverImage || ''
                })}
                placeholder="例如：第1卷"
                className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 font-semibold block mb-2">卷标题</label>
              <input
                type="text"
                value={selectedVolume?.title || ''}
                onChange={(e) => handleUpdateVolume(selectedVolumeIndex, { 
                  name: selectedVolume?.name || '',
                  title: e.target.value,
                  description: selectedVolume?.description || '',
                  coverImage: selectedVolume?.coverImage || ''
                })}
                placeholder="例如：新的开始"
                className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 font-semibold block mb-2">卷描述</label>
              <textarea
                value={selectedVolume?.description || ''}
                onChange={(e) => handleUpdateVolume(selectedVolumeIndex, { 
                  name: selectedVolume?.name || '',
                  title: selectedVolume?.title || '',
                  description: e.target.value,
                  coverImage: selectedVolume?.coverImage || ''
                })}
                placeholder="简要描述这一卷的内容..."
                className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-indigo-400 resize-none"
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 font-semibold block mb-2">封面图片</label>
              <input
                type="text"
                value={selectedVolume?.coverImage || ''}
                onChange={(e) => handleUpdateVolume(selectedVolumeIndex, { 
                  name: selectedVolume?.name || '',
                  title: selectedVolume?.title || '',
                  description: selectedVolume?.description || '',
                  coverImage: e.target.value
                })}
                placeholder="图片URL"
                className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div className="pt-4 border-t border-gray-300">
              <div className="text-sm text-gray-600">
                {selectedVolume?.chapters.length} 话 · {selectedVolume?.chapters.reduce((sum, ch) => sum + ch.pages.length, 0)} 页
              </div>
            </div>
          </div>
        </main>
      </div>

      <VolumeModal onConfirm={handleCreateVolume} />
    </div>
  )
}
