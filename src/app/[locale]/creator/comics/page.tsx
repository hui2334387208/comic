'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'

export default function ComicsPage() {
  const router = useRouter()
  const [comics, setComics] = useState([])
  const [loading, setLoading] = useState(true)

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY-MM-DD')
  }

  useEffect(() => {
    fetchComics()
  }, [])

  const fetchComics = async () => {
    try {
      const response = await fetch('/api/creator/comics')
      const result = await response.json()
      if (result.success) {
        setComics(result.data)
      }
    } catch (error) {
      console.error('获取作品失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            创作漫画
          </h1>
          <p className="text-gray-600 text-lg mt-2">管理和创作你的漫画作品</p>
        </div>
        <button
          onClick={() => router.push('/creator/comics/create')}
          className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all"
        >
          ✨ 创作新漫画
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : comics.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-xl border-4 border-indigo-200/50">
          <div className="w-32 h-32 mx-auto mb-6 bg-indigo-100 rounded-3xl flex items-center justify-center">
            <span className="text-7xl">📚</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-700 mb-4">还没有漫画作品</h3>
          <p className="text-gray-500 mb-8 text-lg">开始创作你的第一部漫画吧！</p>
          <button
            onClick={() => router.push('/creator/comics/create')}
            className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold shadow-xl text-lg hover:shadow-2xl transition-all"
          >
            立即创作
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comics.map((comic: any) => (
            <div
              key={comic.id}
              onClick={() => router.push(`/creator/comics/create?comicId=${comic.id}`)}
              className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all cursor-pointer border-4 border-indigo-200/50 hover:scale-105"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                {comic.coverImage ? (
                  <img src={comic.coverImage} alt={comic.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl">🎨</span>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{comic.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {comic.description || '暂无描述'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {formatDate(comic.createdAt)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    comic.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {comic.status === 'published' ? '已发布' : '草稿'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
