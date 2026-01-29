import { useEffect, useState } from 'react'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setShow(false)
    }
  }

  if (!show) return null
  return (
    <div style={{ position: 'fixed', bottom: 20, left: 0, right: 0, textAlign: 'center', zIndex: 9999 }}>
      <button onClick={handleInstall} style={{ padding: '0.5em 1.5em', fontSize: 18, background: '#317EFB', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
        安装到桌面
      </button>
    </div>
  )
}
