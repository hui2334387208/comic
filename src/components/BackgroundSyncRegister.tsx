'use client'
import { useEffect } from 'react'

export default function BackgroundSyncRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((sw: any) => {
        if (sw.sync && typeof sw.sync.register === 'function') {
          sw.sync.register('sync-data')
        }
      })
    }
  }, [])
  return null
}
