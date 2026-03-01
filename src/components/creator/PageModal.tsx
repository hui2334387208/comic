'use client'

import { usePageModalStore } from '@/store/creator/pageStore'

interface PageModalProps {
  onConfirm: (data: { pageNumber: number; pageLayout: string }) => void
}

export default function PageModal({ onConfirm }: PageModalProps) {
  const { isOpen, form, close, updateForm } = usePageModalStore()

  const handleSubmit = () => {
    onConfirm(form)
    close()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4">添加新页</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 font-semibold block mb-2">页码</label>
            <input
              type="number"
              value={form.pageNumber}
              onChange={(e) => updateForm('pageNumber', parseInt(e.target.value))}
              placeholder="第几页"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:border-pink-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-semibold block mb-2">页面布局</label>
            <select
              value={form.pageLayout}
              onChange={(e) => updateForm('pageLayout', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:border-pink-400"
            >
              <option value="single">单格</option>
              <option value="double">双格</option>
              <option value="multi">多格</option>
              <option value="full">全页</option>
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
            className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-lg transition-all text-sm font-semibold"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  )
}
