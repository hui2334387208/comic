'use client'

import { useState } from 'react'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from 'antd'
import { useRouter } from 'next/navigation'
import PanelModal from '@/components/creator/PanelModal'
import { usePanelModalStore } from '@/store/creator/panelStore'

export default function PanelsManagePage() {
  const router = useRouter()
  const { open: openPanelModal } = usePanelModalStore()
  
  // 临时数据，实际应该从API或状态管理获取
  const [panels, setPanels] = useState([
    { id: 1, panelNumber: 1, sceneDescription: '主角登场', dialogue: '你好，世界！', cameraAngle: '正面' }
  ])
  const [selectedPanelIndex, setSelectedPanelIndex] = useState(0)

  const handleUpdatePanel = (index: number, data: { panelNumber: number; sceneDescription: string; dialogue: string; cameraAngle: string }) => {
    const newPanels = [...panels]
    newPanels[index] = { ...newPanels[index], ...data }
    setPanels(newPanels)
  }

  const handleCreatePanel = (data: { panelNumber: number; sceneDescription: string; dialogue: string; cameraAngle: string }) => {
    setPanels([...panels, { 
      id: panels.length + 1, 
      ...data
    }])
  }

  const addPanel = () => {
    openPanelModal(panels.length + 1)
  }

  const deletePanel = (index: number) => {
    if (panels.length <= 1) {
      alert('至少需要保留一个分镜')
      return
    }
    const newPanels = panels.filter((_, i) => i !== index)
    setPanels(newPanels)
    if (selectedPanelIndex >= newPanels.length) {
      setSelectedPanelIndex(newPanels.length - 1)
    }
  }

  const selectedPanel = panels[selectedPanelIndex]

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
        {/* 左侧：分镜列表 */}
        <aside className="w-80 bg-gradient-to-b from-indigo-50 to-purple-50 border-r-2 border-indigo-200 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">分镜列表</h2>
              <Button size="small" onClick={addPanel}>
                <Plus size={14} className="mr-1" />
                新建
              </Button>
            </div>
            <div className="space-y-2">
              {panels.map((panel, index) => (
                <div
                  key={panel.id}
                  className={`group relative p-4 rounded-xl cursor-pointer transition-all ${
                    selectedPanelIndex === index
                      ? 'bg-orange-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-orange-50'
                  }`}
                >
                  <div onClick={() => setSelectedPanelIndex(index)}>
                    <div className="font-semibold text-sm mb-1">第{panel.panelNumber}格</div>
                    <div className={`text-xs ${selectedPanelIndex === index ? 'text-white/70' : 'text-gray-500'}`}>
                      {panel.sceneDescription || '未设置场景'}
                    </div>
                    <div className={`text-xs mt-1 ${selectedPanelIndex === index ? 'text-white/70' : 'text-gray-400'}`}>
                      {panel.cameraAngle}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deletePanel(index)
                    }}
                    className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all ${
                      selectedPanelIndex === index
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

        {/* 右侧：分镜表单 */}
        <main className="flex-1 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-700 font-semibold block mb-2">分镜编号</label>
              <input
                type="number"
                value={selectedPanel?.panelNumber || 1}
                onChange={(e) => handleUpdatePanel(selectedPanelIndex, { 
                  panelNumber: parseInt(e.target.value) || 1,
                  sceneDescription: selectedPanel?.sceneDescription || '',
                  dialogue: selectedPanel?.dialogue || '',
                  cameraAngle: selectedPanel?.cameraAngle || ''
                })}
                placeholder="分镜编号"
                className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 font-semibold block mb-2">场景描述</label>
              <textarea
                value={selectedPanel?.sceneDescription || ''}
                onChange={(e) => handleUpdatePanel(selectedPanelIndex, { 
                  panelNumber: selectedPanel?.panelNumber || 1,
                  sceneDescription: e.target.value,
                  dialogue: selectedPanel?.dialogue || '',
                  cameraAngle: selectedPanel?.cameraAngle || ''
                })}
                placeholder="描述这一格的场景..."
                className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-indigo-400 resize-none"
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 font-semibold block mb-2">对话内容</label>
              <textarea
                value={selectedPanel?.dialogue || ''}
                onChange={(e) => handleUpdatePanel(selectedPanelIndex, { 
                  panelNumber: selectedPanel?.panelNumber || 1,
                  sceneDescription: selectedPanel?.sceneDescription || '',
                  dialogue: e.target.value,
                  cameraAngle: selectedPanel?.cameraAngle || ''
                })}
                placeholder="这一格的对话..."
                className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-indigo-400 resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 font-semibold block mb-2">镜头角度</label>
              <select
                value={selectedPanel?.cameraAngle || ''}
                onChange={(e) => handleUpdatePanel(selectedPanelIndex, { 
                  panelNumber: selectedPanel?.panelNumber || 1,
                  sceneDescription: selectedPanel?.sceneDescription || '',
                  dialogue: selectedPanel?.dialogue || '',
                  cameraAngle: e.target.value
                })}
                className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-gray-800 focus:outline-none focus:border-indigo-400"
              >
                <option value="">选择镜头角度</option>
                <option value="正面">正面</option>
                <option value="侧面">侧面</option>
                <option value="背面">背面</option>
                <option value="俯视">俯视</option>
                <option value="仰视">仰视</option>
                <option value="特写">特写</option>
                <option value="远景">远景</option>
                <option value="中景">中景</option>
              </select>
            </div>
          </div>
        </main>
      </div>

      <PanelModal onConfirm={handleCreatePanel} />
    </div>
  )
}
