import { headers } from 'next/headers'
import { getLocale } from 'next-intl/server'

import { db } from '@/db'
import { systemLogs } from '@/db/schema/system_logs'

type LogLevel = 'info' | 'warning' | 'error';

interface LogOptions {
  module: string;
  action: string;
  description: string;
  userId?: string;
}

// 获取主要语言代码
function getPrimaryLanguage(language: string | null): string {
  if (!language) return 'en'
  // 提取主要语言代码（例如：从 'zh-CN' 提取 'zh'）
  const primaryLang = language.split('-')[0].toLowerCase()
  return primaryLang
}

// 服务器端日志记录
export async function log(level: LogLevel, options: LogOptions) {
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip')
  const userAgent = headersList.get('user-agent')
  // 使用 Next.js 的 locale 而不是浏览器的 accept-language
  const locale = await getLocale()
  const language = getPrimaryLanguage(locale)

  const logData = {
    level,
    module: options.module,
    action: options.action,
    description: options.description,
    ip: ip || undefined,
    userAgent: userAgent || undefined,
    language,
  }

  // 只在 userId 存在且不为空时添加
  if (options.userId) {
    Object.assign(logData, { userId: options.userId })
  }

  await db.insert(systemLogs).values(logData)
}

// 客户端日志记录
export async function logClient(level: LogLevel, options: LogOptions) {
  try {
    // 从 URL 路径中获取当前语言
    const {pathname} = window.location
    const locale = pathname.split('/')[1] // 获取 URL 中的语言代码
    const language = getPrimaryLanguage(locale)

    await fetch('/api/admin/system/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level,
        ...options,
        language,
      }),
    })
  } catch (error) {
    console.error('Failed to log:', error)
  }
}

export const logger = {
  info: (options: LogOptions) => log('info', options),
  warning: (options: LogOptions) => log('warning', options),
  error: (options: LogOptions) => log('error', options),
}

export const loggerClient = {
  info: (options: LogOptions) => logClient('info', options),
  warning: (options: LogOptions) => logClient('warning', options),
  error: (options: LogOptions) => logClient('error', options),
}
