import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import withPWA from 'next-pwa'

const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  images: {
    domains: [
      'localhost',
      'cdn.storageimagedisplay.com',
      'www.highperformanceformat.com',
      'highperformanceformat.com',
      'landings-cdn.adsterratech.com'
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  // 明确设置trailingSlash行为，避免重定向问题
  trailingSlash: false,
  // 禁用Next.js的自动重定向
  skipTrailingSlashRedirect: true,
  // 其他 Next.js 原生配置可继续添加
}

const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: !isProd, // 只在生产环境启用 PWA
  // 排除广告Service Worker，避免与OneSignal冲突
  exclude: [
    /monetag-3nbf4-worker\.js$/, // 排除3nbf4广告Worker
    /monetag-aiharsoreersu-worker\.js$/, // 排除aiharsoreersu广告Worker
    /monetag-pertwee-worker\.js$/, // 排除pertwee广告Worker
    /monetag-vaugroar-worker\.js$/, // 排除vaugroar广告Worker
    /monetag-couphaithuph-worker\.js$/, // 排除couphaithuph广告Worker
    /OneSignalSDKWorker\.js$/, // 排除 OneSignal 自己的 Service Worker
    /OneSignalSDKUpdaterWorker\.js$/, // 排除 OneSignal 更新 Worker
  ],
  // sw: 'pwa-sw.js', // 使用自定义文件名
  // manifest: '/manifest.json', // 可显式指定 manifest 路径
  // runtimeCaching: [...] // 如需自定义缓存策略可在此配置
}

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(
  withPWA(pwaConfig)(nextConfig)
)
