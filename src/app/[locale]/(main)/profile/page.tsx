'use client'

import { useRouter } from '@/i18n/navigation'
import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'

interface ProfileStats {
  comicCount: number
  favoriteCount: number
  viewCount: number
  receivedLikeCount: number
  aiUsageCount: number
  aiDailyLimit: number
}

interface UserProfile {
  id: string
  name: string
  email: string
  username: string
  avatar: string | null
  role: string
  joinDate: string
  comicCount: number
  favoriteCount: number
  viewCount: number
  likedComicCount: number
  receivedLikeCount: number
  aiUsageCount: number
  aiDailyLimit: number
  creditsBalance: number
}

interface Comic {
  id: number
  title: string
  description: string
  coverImage: string | null
  viewCount: number
  likeCount: number
  volumeCount: number
  category: {
    id: number
    name: string
    slug: string
  } | null
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'stats' | 'comics' | 'favorites' | 'likes'>('stats')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [comics, setComics] = useState<Comic[]>([])
  const [favorites, setFavorites] = useState<Comic[]>([])
  const [likes, setLikes] = useState<Comic[]>([])
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in')
    } else if (status === 'authenticated') {
      loadProfile()
    }
  }, [status, router])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
      } else if (res.status === 401) {
        router.push('/sign-in')
      }
    } catch (error) {
      console.error('加载个人资料失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadComics = async () => {
    if (comics.length > 0) return
    try {
      setContentLoading(true)
      const res = await fetch('/api/user/comics?limit=50')
      if (res.ok) {
        const data = await res.json()
        setComics(data.data?.comics || [])
      }
    } catch (error) {
      console.error('加载漫画失败:', error)
    } finally {
      setContentLoading(false)
    }
  }

  const loadFavorites = async () => {
    if (favorites.length > 0) return
    try {
      setContentLoading(true)
      const res = await fetch('/api/user/favorites?limit=50')
      if (res.ok) {
        const data = await res.json()
        setFavorites(data.data?.favorites || [])
      }
    } catch (error) {
      console.error('加载收藏失败:', error)
    } finally {
      setContentLoading(false)
    }
  }

  const loadLikes = async () => {
    if (likes.length > 0) return
    try {
      setContentLoading(true)
      const res = await fetch('/api/user/likes?limit=50')
      if (res.ok) {
        const data = await res.json()
        setLikes(data.data?.likes || [])
      }
    } catch (error) {
      console.error('加载点赞失败:', error)
    } finally {
      setContentLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'comics') loadComics()
    else if (activeTab === 'favorites') loadFavorites()
    else if (activeTab === 'likes') loadLikes()
  }, [activeTab])

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  const goToComic = (comic: Comic) => {
    const slug = comic.category?.slug || 'default'
    router.push(`/comic/${slug}/${comic.title}/${comic.id}`)
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 py-12">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* 用户头部卡片 */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 border border-purple-100 dark:border-purple-900/30">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            
            {/* 头像 */}
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-1 shadow-xl">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-4xl font-bold text-purple-600">
                    {profile.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </div>

            {/* 用户信息 */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{profile.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-4">@{profile.username}</p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-4 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                  {profile.email}
                </span>
                <span className="px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                  加入于 {new Date(profile.joinDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 text-center shadow-lg border border-purple-100 dark:border-purple-900/30">
            <div className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
              {profile.comicCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">创作</div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 text-center shadow-lg border border-pink-100 dark:border-pink-900/30">
            <div className="text-3xl font-black bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent mb-1">
              {profile.favoriteCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">收藏</div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 text-center shadow-lg border border-blue-100 dark:border-blue-900/30">
            <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1">
              {profile.viewCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">浏览</div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 text-center shadow-lg border border-green-100 dark:border-green-900/30">
            <div className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
              {profile.receivedLikeCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">获赞</div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 text-center shadow-lg border border-orange-100 dark:border-orange-900/30">
            <div className="text-3xl font-black bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent mb-1">
              {profile.likedComicCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">点赞</div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 text-center shadow-lg border border-indigo-100 dark:border-indigo-900/30">
            <div className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
              {profile.creditsBalance}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">次数余额</div>
          </div>
        </div>

        {/* 标签页 */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-2 mb-8 shadow-lg border border-purple-100 dark:border-purple-900/30">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'stats', label: '📊 数据统计', count: null },
              { key: 'comics', label: '📚 我的漫画', count: profile.comicCount },
              { key: 'favorites', label: '❤️ 我的收藏', count: profile.favoriteCount },
              { key: 'likes', label: '👍 我的点赞', count: profile.likedComicCount },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key ? 'bg-white/20' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-purple-100 dark:border-purple-900/30 min-h-[400px]">
          
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">数据统计</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">创作统计</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">创作漫画</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">{profile.comicCount} 部</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">总浏览量</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{profile.viewCount} 次</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">获得点赞</span>
                      <span className="font-bold text-pink-600 dark:text-pink-400">{profile.receivedLikeCount} 个</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">互动统计</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">收藏漫画</span>
                      <span className="font-bold text-red-600 dark:text-red-400">{profile.favoriteCount} 部</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">点赞漫画</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">{profile.likedComicCount} 部</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">次数余额</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{profile.creditsBalance} 次</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">快速操作</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <button
                    onClick={() => router.push('/')}
                    className="p-4 bg-white dark:bg-gray-800 rounded-xl hover:shadow-lg transition-all text-left"
                  >
                    <div className="text-2xl mb-2">🎨</div>
                    <div className="font-bold text-gray-900 dark:text-white">创作新漫画</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">AI帮你生成精彩漫画</div>
                  </button>
                  <button
                    onClick={() => router.push('/comic')}
                    className="p-4 bg-white dark:bg-gray-800 rounded-xl hover:shadow-lg transition-all text-left"
                  >
                    <div className="text-2xl mb-2">🔍</div>
                    <div className="font-bold text-gray-900 dark:text-white">浏览漫画</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">发现更多精彩作品</div>
                  </button>
                  <button
                    onClick={() => router.push('/referral')}
                    className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all text-left relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <div className="relative">
                      <div className="text-2xl mb-2">🎁</div>
                      <div className="font-bold">邀请好友</div>
                      <div className="text-sm opacity-90">获得免费次数奖励</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comics' && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">我的漫画</h2>
              {contentLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : comics.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">还没有创作漫画</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">开始你的第一个AI漫画创作吧！</p>
                  <button
                    onClick={() => router.push('/')}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    立即创作
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {comics.map((comic) => (
                    <div
                      key={comic.id}
                      onClick={() => goToComic(comic)}
                      className="group cursor-pointer bg-white dark:bg-gray-700 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
                    >
                      <div className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 relative overflow-hidden">
                        {comic.coverImage ? (
                          <img src={comic.coverImage} alt={comic.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-6xl">🎨</div>
                        )}
                        {comic.category && (
                          <div className="absolute top-3 left-3 px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-bold">
                            {comic.category.name}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{comic.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{comic.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>👁️ {comic.viewCount}</span>
                          <span>❤️ {comic.likeCount}</span>
                          {comic.volumeCount > 0 && <span>📚 {comic.volumeCount}卷</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">我的收藏</h2>
              {contentLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">❤️</div>
                  <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">还没有收藏</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">去发现喜欢的漫画吧！</p>
                  <button
                    onClick={() => router.push('/comic')}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    浏览漫画
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((comic) => (
                    <div
                      key={comic.id}
                      onClick={() => goToComic(comic)}
                      className="group cursor-pointer bg-white dark:bg-gray-700 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
                    >
                      <div className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 relative overflow-hidden">
                        {comic.coverImage ? (
                          <img src={comic.coverImage} alt={comic.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-6xl">🎨</div>
                        )}
                        {comic.category && (
                          <div className="absolute top-3 left-3 px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-bold">
                            {comic.category.name}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{comic.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{comic.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>👁️ {comic.viewCount}</span>
                          <span>❤️ {comic.likeCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'likes' && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">我的点赞</h2>
              {contentLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : likes.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">👍</div>
                  <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">还没有点赞</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">为喜欢的作品点赞吧！</p>
                  <button
                    onClick={() => router.push('/comic')}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    浏览漫画
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {likes.map((comic) => (
                    <div
                      key={comic.id}
                      onClick={() => goToComic(comic)}
                      className="group cursor-pointer bg-white dark:bg-gray-700 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
                    >
                      <div className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 relative overflow-hidden">
                        {comic.coverImage ? (
                          <img src={comic.coverImage} alt={comic.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-6xl">🎨</div>
                        )}
                        {comic.category && (
                          <div className="absolute top-3 left-3 px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-bold">
                            {comic.category.name}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{comic.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{comic.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>👁️ {comic.viewCount}</span>
                          <span>❤️ {comic.likeCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
