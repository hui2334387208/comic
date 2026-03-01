'use client'

import { useVolumeModalStore } from '@/store/creator/volumeStore'

interface VolumeModalProps {
  onConfirm: (data: { name: string; title: string; description: string; coverImage: string }) => void
}

export default function VolumeModal({ onConfirm }: VolumeModalProps) {
  const { isOpen, form, close, updateForm } = useVolumeModalStore()

  const handleSubmit = () => {
    if (!form.title.trim()) return
    onConfirm(form)
    close()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4">添加新卷</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 font-semibold block mb-2">卷标题</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => {
                updateForm('title', e.target.value)
                updateForm('name', e.target.value)
              }}
              placeholder="例如：第1卷"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-semibold block mb-2">卷描述</label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              placeholder="简要描述这一卷的内容"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:border-indigo-400 resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-semibold block mb-2">封面图片</label>
            <input
              type="text"
              value={form.coverImage}
              onChange={(e) => updateForm('coverImage', e.target.value)}
              placeholder="图片URL"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:border-indigo-400"
            />
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
            disabled={!form.title.trim()}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg transition-all text-sm font-semibold disabled:cursor-not-allowed"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  )
}
