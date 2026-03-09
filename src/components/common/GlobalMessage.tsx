'use client'

import { createRoot } from 'react-dom/client'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

type MessageType = 'success' | 'error' | 'warning' | 'info'

interface MessageItem {
  id: string
  type: MessageType
  content: string
  removing: boolean
}

let messageContainer: HTMLDivElement | null = null
let messageRoot: any = null
let messages: MessageItem[] = []

const getStyles = (type: MessageType) => {
  switch (type) {
    case 'success':
      return {
        icon: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
        className: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30'
      }
    case 'error':
      return {
        icon: <XCircle className="w-5 h-5 flex-shrink-0" />,
        className: 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/30'
      }
    case 'warning':
      return {
        icon: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
        className: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
      }
    case 'info':
      return {
        icon: <Info className="w-5 h-5 flex-shrink-0" />,
        className: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
      }
  }
}

function MessageContainer({ items }: { items: MessageItem[] }) {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none">
      {items.map((item) => {
        const styles = getStyles(item.type)
        return (
          <div
            key={item.id}
            className={`${styles.className} rounded-xl px-5 py-3.5 flex items-center gap-3 min-w-[320px] max-w-[500px] backdrop-blur-sm transition-all duration-300 ${
              item.removing ? 'opacity-0 scale-95 -translate-y-2' : 'opacity-100 scale-100 translate-y-0'
            }`}
            style={{
              animation: item.removing ? 'none' : 'slideInDown 0.3s ease-out'
            }}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm">
              {styles.icon}
            </div>
            <span className="text-sm font-medium flex-1">{item.content}</span>
          </div>
        )
      })}
      <style jsx>{`
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

function initContainer() {
  if (!messageContainer) {
    messageContainer = document.createElement('div')
    document.body.appendChild(messageContainer)
    messageRoot = createRoot(messageContainer)
  }
}

function render() {
  if (messageRoot) {
    messageRoot.render(<MessageContainer items={messages} />)
  }
}

function showMessage(type: MessageType, content: string) {
  initContainer()
  
  const id = `message-${Date.now()}-${Math.random()}`
  const newMessage: MessageItem = { id, type, content, removing: false }
  
  messages = [...messages, newMessage]
  render()
  
  setTimeout(() => {
    messages = messages.map(m => m.id === id ? { ...m, removing: true } : m)
    render()
    
    setTimeout(() => {
      messages = messages.filter(m => m.id !== id)
      render()
    }, 300)
  }, 3000)
}

export const globalMessage = {
  success: (content: string) => showMessage('success', content),
  error: (content: string) => showMessage('error', content),
  warning: (content: string) => showMessage('warning', content),
  info: (content: string) => showMessage('info', content),
}

export default function GlobalMessage() {
  return null
}
