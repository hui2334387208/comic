'use client'

import { useCompositionModalStore } from '@/store/creator/compositionStore'

interface CompositionModalProps {
  onConfirm: (data: { name: string; description: string; style: string }) => void
}

export default function CompositionModal({ onConfirm }: CompositionModalProps) {
  const { isOpen, form, close, updateForm } = useCompositionModalStore()

  const handleSubmit = () => {
    if (!form.name.trim()) return
    onConfirm(form)
    close()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4">创建分镜合成</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 font-semibold block mb-2">合成名称</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              placeholder="例如：场景1合成"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-semibold block mb-2">合成描述</label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              placeholder="描述这个合成的用途"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:border-teal-400 resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-semibold block mb-2">合成风格</label>
            <select
              value={form.style}
              onChange={(e) => updateForm('style', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:border-teal-400"
            >
              <option value="default">默认</option>
              <option value="manga">漫画风</option>
              <option value="anime">动画风</option>
              <option value="realistic">写实风</option>
              <option value="sketch">素描风</option>
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
            disabled={!form.name.trim()}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg transition-all text-sm font-semibold disabled:cursor-not-allowed"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  )
}
