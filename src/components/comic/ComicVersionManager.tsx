'use client'
import dayjs from 'dayjs'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import React, { useState, useEffect } from 'react'

interface ComicVersion {
  id: number;
  comicId: number;
  version: number;
  parentVersionId?: number;
  versionDescription?: string;
  isLatestVersion: boolean;
  originalComicId?: number;
  frameCount: number; // 漫画帧数
  createdAt: string;
  updatedAt: string;
}

interface ComicVersionManagerProps {
  comicId: number; // 漫画ID
  currentVersion?: ComicVersion;
  onVersionChange?: (version: ComicVersion) => void;
  versions: ComicVersion[];
}

export default function ComicVersionManager({
  comicId,
  currentVersion,
  onVersionChange,
  versions,
}: ComicVersionManagerProps) {
  const t = useTranslations('main.comic.version') // 使用漫画相关的翻译
  
  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY-MM-DD')
  }

  return (
    <div className="mb-8">
      {versions.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:bg-purple-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl">📚</span>
          </div>
          <p className="text-lg font-medium">{t('noVersionHistory') || '暂无版本历史'}</p>
          <p className="text-sm text-gray-400 mt-1">这是第一个版本</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-4 min-w-max">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`group flex-shrink-0 w-64 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden
                  ${currentVersion?.version === version.version 
                    ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 shadow-lg' 
                    : 'border-purple-200 dark:border-purple-700 bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-800 dark:to-purple-900/20 hover:border-purple-300 hover:shadow-md'
                  }`}
                onClick={() => onVersionChange?.(version)}
              >
                {/* 漫画装饰背景 */}
                <div className="absolute top-2 right-2 w-8 h-8 opacity-10">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-purple-600">
                    <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="3"/>
                    <circle cx="50" cy="50" r="15" fill="currentColor"/>
                  </svg>
                </div>

                {/* 版本头部 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
                      <span className="text-white text-sm font-bold">📚</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {t('version') || '版本'} {version.version}
                    </span>
                  </div>
                  
                  {/* 版本号标识 - 漫画风格 */}
                  <div className="w-6 h-6 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-purple-800 text-xs font-bold">{version.version}</span>
                  </div>
                </div>

                {/* 状态标签 */}
                <div className="flex gap-2 mb-3">
                  {version.isLatestVersion && (
                    <span className="px-2 py-1 bg-gradient-to-r from-green-100 to-green-200 text-green-700 text-xs rounded-md font-medium border border-green-300 shadow-sm">
                      {t('latest') || '最新'}
                    </span>
                  )}
                  {currentVersion?.version === version.version && (
                    <span className="px-2 py-1 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 text-xs rounded-md font-medium border border-purple-300 shadow-sm">
                      {t('current') || '当前'}
                    </span>
                  )}
                </div>

                {/* 版本信息 - 漫画风格 */}
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500">📅</span>
                    <span>{formatDate(version.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-500">🎨</span>
                    <span>{t('frameCount', { count: version.frameCount }) || `${version.frameCount} 帧`}</span>
                  </div>
                </div>

                {/* 版本描述 - 漫画对话框风格 */}
                {version.versionDescription && (
                  <div className="mt-3 relative">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800 shadow-inner">
                      {/* 对话框小尾巴 */}
                      <div className="absolute -left-2 top-3 w-0 h-0 border-t-4 border-t-transparent border-r-4 border-r-purple-50 dark:border-r-purple-950/20 border-b-4 border-b-transparent"></div>
                      
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-purple-600 text-xs">📝</span>
                        <span className="text-xs font-medium text-purple-800 dark:text-purple-200">{t('versionDescription') || '版本说明'}</span>
                      </div>
                      <p className="text-xs text-purple-900 dark:text-purple-100 line-clamp-2">
                        {version.versionDescription}
                      </p>
                    </div>
                  </div>
                )}

                {/* 悬停光效 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-2xl pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}