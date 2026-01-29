'use client'

import { useEffect, useState } from 'react'

interface DevToolsBlockerProps {
  /** 是否启用开发者工具检测 */
  enabled?: boolean
  /** 检测间隔时间（毫秒） */
  interval?: number
}

export default function DevToolsBlocker({
  enabled = true,
  interval = 200
}: DevToolsBlockerProps) {
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false)

  useEffect(() => {
    if (!enabled) return

    let devtools = {
      open: false,
      orientation: null
    }

    const threshold = 160

    const checkDevTools = () => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true
          setIsDevToolsOpen(true)
        }
      } else {
        if (devtools.open) {
          devtools.open = false
          setIsDevToolsOpen(false)
        }
      }
    }

    // 检测窗口大小变化
    const handleResize = () => {
      checkDevTools()
    }

    // 检测控制台是否打开
    let devtoolsChecker: NodeJS.Timeout

    const startDevToolsChecker = () => {
      devtoolsChecker = setInterval(() => {
        if (devtools.open) {
          setIsDevToolsOpen(true)
        }
      }, interval)
    }

    const stopDevToolsChecker = () => {
      if (devtoolsChecker) {
        clearInterval(devtoolsChecker)
      }
    }

    // 检测开发者工具的方法
    const detectDevTools = () => {
      let devtools = false
      const start = performance.now()
      debugger
      const end = performance.now()
      
      if (end - start > 100) {
        devtools = true
      }
      
      return devtools
    }

    // 定期检测
    const checkInterval = setInterval(() => {
      if (detectDevTools()) {
        setIsDevToolsOpen(true)
      }
    }, interval)

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)
    
    // 监听键盘事件
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault()
        setIsDevToolsOpen(true)
        return false
      }
      
      // Ctrl+Shift+I
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault()
        setIsDevToolsOpen(true)
        return false
      }
      
      // Ctrl+Shift+J
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault()
        setIsDevToolsOpen(true)
        return false
      }
      
      // Ctrl+U
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault()
        setIsDevToolsOpen(true)
        return false
      }
    }

    // 禁用右键菜单
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('contextmenu', handleContextMenu)

    // 清理函数
    return () => {
      clearInterval(checkInterval)
      stopDevToolsChecker()
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [enabled, interval])

  // 如果检测到开发者工具，显示白屏
  if (isDevToolsOpen) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'white',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* 白屏，不显示任何内容 */}
      </div>
    )
  }

  return null
}
