'use client'

import { usePanelModalStore } from '@/store/creator/panelStore'

interface PanelModalProps {
  onConfirm: (data: { panelNumber: number; sceneDescription: string; dialogue: string; cameraAngle: string }) => void
}

export default function PanelModal({ onConfirm }: PanelModalProps) {
  const { isOpen, form, close, updateForm } = usePanelModalStore()

  const handleSubmit = () => {
    onConfirm(form)
    close()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4">添加新分镜</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 font-semibold block mb-2">分镜序号</label>
            <input
              type="number"
              value={form.panelNumber}
              onChange={(e) => updateForm('panelNumber', parseInt(e.target.value))}
              placeholder="第几格"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:border-orange-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-semibold block mb-2">画面描述</label>
            <textarea
              value={form.sceneDescription}
              onChange={(e) => updateForm('sceneDescription', e.target.value)}
              placeholder="描述这一格的画面内容"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:border-orange-400 resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-semibold block mb-2">对话</label>
            <textarea
              value={form.dialogue}
              onChange={(e) => updateForm('dialogue', e.target.value)}
              placeholder="角色对话内容"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:border-orange-400 resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-semibold block mb-2">镜头角度</label>
            <select
              value={form.cameraAngle}
              onChange={(e) => updateForm('cameraAngle', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:border-orange-400"
            >
              <option value="normal">正常</option>
              <option value="close-up">特写</option>
              <option value="wide">广角</option>
              <option value="low">仰视</option>
              <option value="high">俯视</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={close}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all text-sm font-semibold"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-lg transition-all text-sm font-semibold"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  )
}
