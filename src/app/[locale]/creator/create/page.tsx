'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreatePage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [language, setLanguage] = useState('zh')
  const [style, setStyle] = useState('anime')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!prompt.trim()) {
      alert('请输入你的创意')
      return
    }

    setLoading(true)
    try {
      // 1. 生成剧本
      const metaResponse = await fetch('/api/comic/generate/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, language, style }),
      })
      const metaData = await metaResponse.json()
      if (!metaData.success) throw new Error(metaData.error)

      // 2. 创建漫画
      const createResponse = await fetch('/api/comic/generate/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          title: metaData.data.title,
          description: metaData.data.description,
          category: metaData.data.category,
          tags: metaData.data.tags,
          style,
          volumes: metaData.data.volumes,
          language,
        }),
      })
      const createData = await createResponse.json()
      if (!createData.success) throw new Error(createData.error)

      const comicId = createData.data.id

      // 3. 生成封面
      await fetch('/api/comic/generate/cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comicId }),
      })

      // 4. 生成页面
      await fetch('/api/comic/generate/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comicId }),
      })

      alert('创作成功！')
      router.push(`/creator/works/${comicId}`)
    } catch (error: any) {
      alert(error.message || '创作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          创作新漫画
        </h1>
        <p className="text-gray-600 text-lg">用AI将你的创意变成精彩漫画</p>
      </div>

      <div className="bg-white rounded-3xl p-10 shadow-2xl border-4 border-indigo-200/50">
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-3">故事创意</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想创作的漫画故事，例如：一个关于时间旅行的科幻故事..."
              rows={6}
              className="w-full px-6 py-4 border-2 border-indigo-200 rounded-2xl focus:border-indigo-600 focus:outline-none text-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-3">语言</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-6 py-4 border-2 border-indigo-200 rounded-2xl focus:border-indigo-600 focus:outline-none text-lg"
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-700 mb-3">画风</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-6 py-4 border-2 border-indigo-200 rounded-2xl focus:border-indigo-600 focus:outline-none text-lg"
              >
                <option value="anime">日式动漫</option>
                <option value="manga">日式漫画</option>
                <option value="realistic">写实风格</option>
                <option value="cartoon">卡通风格</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !prompt.trim()}
            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ 创作中...' : '✨ 开始创作'}
          </button>
        </div>
      </div>
    </div>
  )
}
