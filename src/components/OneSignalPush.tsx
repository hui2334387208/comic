'use client'
import { useEffect } from 'react'

export default function OneSignalPush() {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
      // 动态插入 OneSignal 脚本
      if (!document.getElementById('onesignal-sdk')) {
        const script = document.createElement('script')
        script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js'
        script.async = true
        script.id = 'onesignal-sdk'
        script.crossOrigin = 'anonymous'
        document.head.appendChild(script)
      }

      // 等待脚本加载完成
      const initOneSignal = () => {
        // @ts-ignore
        window.OneSignal = window.OneSignal || []
        // @ts-ignore
        window.OneSignal.push(() => {
          // @ts-ignore
          window.OneSignal.init({
            appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
            // 自动重新订阅（官方推荐）
            autoResubscribe: true,
            // 权限请求配置
            promptOptions: {
              slidedown: {
                enabled: true,
                autoPrompt: true,
                timeDelay: 5,
                pageViews: 1,
                actionMessage: "获取最新时间线更新通知",
                acceptButtonText: "允许",
                cancelButtonText: "稍后"
              }
            },
            // 通知按钮配置
            notifyButton: {
              enable: true
            },
            // 欢迎通知配置
            welcomeNotification: {
              disable: false,
              title: "欢迎使用文鳐对联！",
              message: "您将收到最新的对联创作通知"
            },
            // 通知持久化（Chrome桌面版）
            persistNotification: true,
            // 通知点击处理
            notificationClickHandlerMatch: "exact",
            notificationClickHandlerAction: "navigate"
          })

          // 监听订阅状态变化
          // @ts-ignore
          window.OneSignal.push(() => {
            // @ts-ignore
            window.OneSignal.on('subscriptionChange', (isSubscribed) => {
              console.log('OneSignal subscription changed:', isSubscribed)
            })
          })

          // 检查权限状态并处理
          // @ts-ignore
          window.OneSignal.push(() => {
            // @ts-ignore
            window.OneSignal.getNotificationPermission().then((permission) => {
              console.log('OneSignal permission status:', permission)
              
              if (permission === 'default') {
                // 延迟显示权限请求，避免干扰用户体验
                setTimeout(() => {
                  // @ts-ignore
                  window.OneSignal.showNativePrompt()
                }, 3000)
              } else if (permission === 'granted') {
                // 权限已授予，确保用户已订阅
                // @ts-ignore
                window.OneSignal.isPushNotificationsEnabled().then((isEnabled) => {
                  console.log('Push notifications enabled:', isEnabled)
                  if (!isEnabled) {
                    // 如果权限已授予但未订阅，自动订阅
                    // @ts-ignore
                    window.OneSignal.setSubscription(true)
                  }
                })
              }
            })
          })
        })
      }

      // 检查脚本是否已加载
      if (window.OneSignal) {
        initOneSignal()
      } else {
        // 等待脚本加载
        let attempts = 0
        const maxAttempts = 50 // 5秒超时
        
        const checkOneSignal = setInterval(() => {
          attempts++
          // @ts-ignore
          if (window.OneSignal || attempts >= maxAttempts) {
            clearInterval(checkOneSignal)
            if (window.OneSignal) {
              initOneSignal()
            } else {
              console.warn('OneSignal failed to load after 5 seconds')
            }
          }
        }, 100)
      }
    }
  }, [])

  return null
}
