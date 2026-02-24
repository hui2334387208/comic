'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'

interface UserData {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
    joinDate: string;
    comicCount: number;
    favoriteCount: number;
    viewCount: number;
    likedComicCount?: number;
    receivedLikeCount?: number;
}

interface Comic {
    id: string;
    title: string;
    slug: string;
    description: string;
    coverImage?: string;
    status?: string;
    category?: {
        id: number;
        name: string;
        slug: string;
    };
    isPublic?: boolean;
    viewCount?: number;
    likeCount?: number;
    volumeCount?: number;
    episodeCount?: number;
    createdAt?: string;
    updatedAt?: string;
    likedAt?: string;
    favoritedAt?: string;
}

export default function ProfilePage() {
    const t = useTranslations('main.profile')
    const lang = typeof window !== 'undefined' ? (navigator.language.startsWith('en') ? 'en' : 'zh-cn') : 'zh-cn'

    const [activeTab, setActiveTab] = useState('comics')
    const [userData, setUserData] = useState<UserData | null>(null)
    const [userComics, setUserComics] = useState<Comic[]>([])
    const [favorites, setFavorites] = useState<Comic[]>([])
    const [likes, setLikes] = useState<Comic[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            fetch('/api/user/profile').then(res => (res.ok ? res.json() : null)),
            fetch('/api/user/comics').then(res => (res.ok ? res.json() : [])),
            fetch('/api/user/favorites').then(res => (res.ok ? res.json() : [])),
            fetch('/api/user/likes').then(res => (res.ok ? res.json() : [])),
        ])
            .then(([user, comics, favs, liked]) => {
                setUserData(user)
                setUserComics(Array.isArray(comics?.data?.comics) ? comics.data.comics : [])
                setFavorites(Array.isArray(favs?.data?.favorites) ? favs.data.favorites : [])
                setLikes(Array.isArray(liked?.data?.likes) ? liked.data.likes : [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const tabs = [
        { id: 'comics', name: t('tabs.comics'), icon: '📚' },
        { id: 'likes', name: t('tabs.likes'), icon: '👍' },
        { id: 'favorites', name: t('tabs.favorites'), icon: '❤️' },
    ]

    const formatDate = (dateString?: string | number) => {
        if (!dateString) return ''
        return dayjs(dateString).locale(lang).format('YYYY-MM-DD')
    }

    const formatNumber = (num?: number) => {
        if (!num) return '0'
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}k`
        }
        return num.toString()
    }

    const profileInitial = userData?.name?.charAt(0)?.toUpperCase() ?? '?'

    const stats = [
        { label: t('overview.myComics'), value: formatNumber(userData?.comicCount), accent: 'from-red-500/15 to-red-500/5' },
        { label: t('overview.likedComics'), value: formatNumber(userData?.likedComicCount ?? likes.length), accent: 'from-emerald-500/15 to-emerald-500/5' },
        { label: t('overview.favoriteComics'), value: formatNumber(userData?.favoriteCount ?? favorites.length), accent: 'from-rose-500/15 to-rose-500/5' },
        { label: t('overview.receivedLikes'), value: formatNumber(userData?.receivedLikeCount ?? 0), accent: 'from-purple-500/15 to-purple-500/5' },
    ]

    const renderComics = () => (
        <div className="space-y-6">
            {userComics.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-red-200 dark:border-red-700 bg-gradient-to-br from-red-50/50 to-orange-50/50 dark:bg-gradient-to-br dark:from-red-900/10 dark:to-orange-900/10 p-12 text-center">
                    <div className="text-5xl">📚</div>
                    <p className="mt-4 text-lg font-semibold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">{t('comics.empty')}</p>
                    <p className="text-gray-600 dark:text-gray-400">{t('comics.create')}</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {userComics.map((comic) => (
                        <div key={comic.id} className="rounded-2xl border-2 border-red-100 dark:border-red-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-red-300 dark:hover:border-red-600 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-bl-full"></div>
                            <div className="flex items-start justify-between relative z-10 mb-4">
                                <div className="flex-1">
                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        {comic.category?.name || t('comics.category')}
                                    </p>
                                    <h4 className="mt-1 text-lg font-semibold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">{comic.title}</h4>
                                </div>
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${comic.isPublic
                                        ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-300 border border-green-200 dark:border-green-800'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                                        }`}
                                >
                                    {comic.isPublic ? t('comics.public') : t('comics.private')}
                                </span>
                            </div>
                            
                            {comic.coverImage && (
                                <div className="mb-4 rounded-xl overflow-hidden">
                                    <img src={comic.coverImage} alt={comic.title} className="w-full h-48 object-cover" />
                                </div>
                            )}
                            
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{comic.description}</p>
                            
                            <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400 mb-4">
                                <span className="hover:text-red-600 dark:hover:text-red-400 transition-colors">{t('comics.views', { count: String(formatNumber(comic.viewCount)) })}</span>
                                <span className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">{t('comics.likes', { count: String(comic.likeCount ?? 0) })}</span>
                                <span className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('comics.volumes', { count: String(comic.volumeCount ?? 0) })}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {t('comics.updated', { date: formatDate(comic.updatedAt || comic.createdAt || '') })}
                                </span>
                                <Link
                                    href={`/comic/${comic.category?.slug}/${comic.slug}/${comic.id}`}
                                    className="rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:from-red-700 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    {t('comics.view')}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )

    const renderLikes = () => (
        <div className="space-y-6">
            {likes.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-orange-200 dark:border-orange-700 bg-gradient-to-br from-orange-50/50 to-yellow-50/50 dark:bg-gradient-to-br dark:from-orange-900/10 dark:to-yellow-900/10 p-12 text-center">
                    <div className="text-5xl">👍</div>
                    <p className="mt-4 text-lg font-semibold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">{t('likes.empty')}</p>
                    <p className="text-gray-600 dark:text-gray-400">{t('likes.noLikes')}</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {likes.map((like) => (
                        <div key={like.id} className="rounded-2xl border-2 border-orange-100 dark:border-orange-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-orange-300 dark:hover:border-orange-600 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-bl-full"></div>
                            <div className="flex items-center justify-between relative z-10 mb-4">
                                <div className="flex-1">
                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        {like.category?.name || t('likes.uncategorized')}
                                    </p>
                                    <h4 className="mt-1 text-lg font-semibold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">{like.title}</h4>
                                </div>
                                <button
                                    className="text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                    onClick={async () => {
                                        await fetch(`/api/comic/${like.id}/like`, { method: 'DELETE' })
                                        setLikes(prev => prev.filter(l => String(l.id) !== String(like.id)))
                                    }}
                                >
                                    {t('likes.remove')}
                                </button>
                            </div>
                            
                            {like.coverImage && (
                                <div className="mb-4 rounded-xl overflow-hidden">
                                    <img src={like.coverImage} alt={like.title} className="w-full h-48 object-cover" />
                                </div>
                            )}
                            
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{like.description}</p>
                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                <span className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">{t('likes.liked', { date: formatDate(like.likedAt || '') })}</span>
                                <Link
                                    href={`/comic/${like.category?.slug}/${like.slug}/${like.id}`}
                                    className="rounded-xl bg-gradient-to-r from-orange-600 to-yellow-600 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:from-orange-700 hover:to-yellow-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    {t('likes.view')}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )

    const renderFavorites = () => (
        <div className="space-y-6">
            {favorites.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-yellow-200 dark:border-yellow-700 bg-gradient-to-br from-yellow-50/50 to-red-50/50 dark:bg-gradient-to-br dark:from-yellow-900/10 dark:to-red-900/10 p-12 text-center">
                    <div className="text-5xl">⭐</div>
                    <p className="mt-4 text-lg font-semibold bg-gradient-to-r from-yellow-600 to-red-600 bg-clip-text text-transparent">{t('favorites.empty')}</p>
                    <p className="text-gray-600 dark:text-gray-400">{t('favorites.noFavorites')}</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {favorites.map((favorite) => (
                        <div key={favorite.id} className="rounded-2xl border-2 border-yellow-100 dark:border-yellow-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-yellow-300 dark:hover:border-yellow-600 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-yellow-500/10 to-red-500/10 rounded-bl-full"></div>
                            <div className="flex items-center justify-between relative z-10 mb-4">
                                <div className="flex-1">
                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        {favorite.category?.name || t('favorites.uncategorized')}
                                    </p>
                                    <h4 className="mt-1 text-lg font-semibold bg-gradient-to-r from-yellow-600 to-red-600 bg-clip-text text-transparent">{favorite.title}</h4>
                                </div>
                                <button
                                    className="text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                    onClick={async () => {
                                        await fetch(`/api/comic/${favorite.id}/favorite`, { method: 'DELETE' })
                                        setFavorites(prev => prev.filter(f => f.id !== favorite.id))
                                    }}
                                >
                                    {t('favorites.remove')}
                                </button>
                            </div>
                            
                            {favorite.coverImage && (
                                <div className="mb-4 rounded-xl overflow-hidden">
                                    <img src={favorite.coverImage} alt={favorite.title} className="w-full h-48 object-cover" />
                                </div>
                            )}
                            
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{favorite.description}</p>
                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                <span className="hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors">{t('favorites.added', { date: formatDate(favorite.favoritedAt || '') })}</span>
                                <Link
                                    href={`/comic/${favorite.category?.slug}/${favorite.slug}/${favorite.id}`}
                                    className="rounded-xl bg-gradient-to-r from-yellow-600 to-red-600 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:from-yellow-700 hover:to-red-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    {t('favorites.view')}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )

    const renderSettings = () => (
        <div className="space-y-6">
            <div className="rounded-2xl border-2 border-red-200 dark:border-red-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-bl-full"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-yellow-500/10 to-red-500/10 rounded-tr-full"></div>
                <div className="relative z-10">
                    <h3 className="text-xl font-semibold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">{t('settings.basic')}</h3>
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">{t('settings.username')}</label>
                            <input
                                type="text"
                                value={userData?.name || ''}
                                className="mt-2 w-full rounded-xl border-2 border-red-200 dark:border-red-800 bg-transparent px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">{t('settings.email')}</label>
                            <input
                                type="email"
                                value={userData?.email || ''}
                                className="mt-2 w-full rounded-xl border-2 border-orange-200 dark:border-orange-800 bg-transparent px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-colors"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">{t('overview.bio')}</label>
                            <textarea
                                value={userData?.bio || ''}
                                rows={4}
                                className="mt-2 w-full rounded-xl border-2 border-yellow-200 dark:border-yellow-800 bg-transparent px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button className="rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-6 py-2 text-sm font-semibold text-white transition-all duration-300 hover:from-red-700 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            {t('settings.save')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-orange-900/20 py-10 relative overflow-hidden">
            {/* Traditional decorative elements */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-10 left-10 w-32 h-32 border-2 border-red-600 rounded-full"></div>
                <div className="absolute top-20 right-20 w-24 h-24 border-2 border-orange-500 rounded-full"></div>
                <div className="absolute bottom-20 left-20 w-28 h-28 border-2 border-yellow-600 rounded-full"></div>
                <div className="absolute bottom-10 right-10 w-20 h-20 border-2 border-red-500 rounded-full"></div>
            </div>
            
            <div className="mx-auto max-w-7xl px-4 relative z-10">
                <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="space-y-6">
                        <section className="rounded-2xl border-2 border-red-200 dark:border-red-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-bl-full"></div>
                            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-yellow-500/20 to-red-500/20 rounded-tr-full"></div>
                            <div className="flex items-start justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 text-2xl font-bold text-white shadow-lg">
                                        {profileInitial}
                                    </div>
                                    <h2 className="text-2xl font-semibold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">{userData?.name || t('overview.username')}</h2>
                                </div>
                            </div>

                            <div className="mt-6 space-y-2 relative z-10">
                                <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                                    <span className="hover:text-red-600 dark:hover:text-red-400 transition-colors">{t('overview.joined', { date: formatDate(userData?.joinDate || '') })}</span>
                                    <span className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">{t('overview.email', { email: userData?.email || '—' })}</span>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border-2 border-orange-200 dark:border-orange-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-bl-full"></div>
                            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-red-500/20 to-orange-500/20 rounded-tr-full"></div>
                            <div className="relative z-10">
                                <h3 className="text-sm font-semibold uppercase tracking-wide bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">{t('overview.quickStats')}</h3>
                                <div className="mt-4 grid gap-4">
                                    {stats.map((stat, index) => {
                                        const gradients = [
                                            'from-red-500/15 to-red-500/5 border-red-200 dark:border-red-800',
                                            'from-orange-500/15 to-orange-500/5 border-orange-200 dark:border-orange-800',
                                            'from-yellow-500/15 to-yellow-500/5 border-yellow-200 dark:border-yellow-800',
                                            'from-red-600/15 to-orange-600/5 border-red-300 dark:border-red-700'
                                        ];
                                        return (
                                            <div key={stat.label} className={`rounded-2xl bg-gradient-to-r ${gradients[index]} border px-4 py-3 hover:shadow-lg transition-all duration-300`}>
                                                <p className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">{stat.label}</p>
                                                <p className="text-2xl font-semibold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">{stat.value}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>
                    </aside>

                    <section className="space-y-6">
                        <div className="rounded-2xl border-2 border-red-200 dark:border-red-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-2 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-bl-full"></div>
                            <div className="flex flex-wrap gap-2 relative z-10">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition md:flex-none md:px-6 ${activeTab === tab.id
                                            ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-600/30'
                                            : 'text-gray-600 hover:bg-red-50 dark:text-gray-300 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
                                            }`}
                                    >
                                        <span>{tab.icon}</span>
                                        {tab.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border-2 border-orange-200 dark:border-orange-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-bl-full"></div>
                            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-red-500/10 to-orange-500/10 rounded-tr-full"></div>
                            <div className="relative z-10">
                                {loading ? (
                                    <div className="py-20 text-center">
                                        <div className="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                        <p className="text-gray-500 dark:text-gray-400">加载中...</p>
                                    </div>
                                ) : (
                                    <>
                                        {activeTab === 'comics' && renderComics()}
                                        {activeTab === 'likes' && renderLikes()}
                                        {activeTab === 'favorites' && renderFavorites()}
                                    </>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
