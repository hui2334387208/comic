'use client'
import dayjs from 'dayjs'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import React, { useState, useEffect } from 'react'

interface CoupletVersion {
  id: number;
  coupletId: number;
  version: number;
  parentVersionId?: number;
  versionDescription?: string;
  isLatestVersion: boolean;
  originalCoupletId?: number;
  contentCount: number; // 对联内容数量
  createdAt: string;
  updatedAt: string;
}

interface CoupletVersionManagerProps {
  coupletId: number; // 对联ID
  currentVersion?: CoupletVersion;
  onVersionChange?: (version: CoupletVersion) => void;
  versions: CoupletVersion[];
}

export default function CoupletVersionManager({
  coupletId,
  currentVersion,
  onVersionChange,
  versions,
}: CoupletVersionManagerProps) {
  const t = useTranslations('main.couplet.version') // 使用对联相关的翻译
  
  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY-MM-DD')
  }

  return (
    <div className="mb-8">
      {versions.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📝</span>
          </div>
          <p className="text-lg font-medium">{t('noVersionHistory')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('noVersionHistory')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-4 min-w-max">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`flex-shrink-0 w-64 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer
                  ${currentVersion?.version === version.version 
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/20' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-red-300 hover:shadow-md'
                  }`}
                onClick={() => onVersionChange?.(version)}
              >
                {/* 版本头部 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">📝</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {t('version')} {version.version}
                    </span>
                  </div>
                  
                  {/* 版本号标识 */}
                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-red-800 text-xs font-bold">{version.version}</span>
                  </div>
                </div>

                {/* 状态标签 */}
                <div className="flex gap-2 mb-3">
                  {version.isLatestVersion && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md font-medium">
                      {t('latest')}
                    </span>
                  )}
                  {currentVersion?.version === version.version && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-md font-medium">
                      {t('current')}
                    </span>
                  )}
                </div>

                {/* 版本信息 */}
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500">📅</span>
                    <span>{formatDate(version.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500">🎋</span>
                    <span>{t('coupletCount', { count: version.contentCount })}</span>
                  </div>
                </div>

                {/* 版本描述 */}
                {version.versionDescription && (
                  <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-amber-600 text-xs">📝</span>
                      <span className="text-xs font-medium text-amber-800 dark:text-amber-200">{t('versionDescription')}</span>
                    </div>
                    <p className="text-xs text-amber-900 dark:text-amber-100 line-clamp-2">
                      {version.versionDescription}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
