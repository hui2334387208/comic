import { Metadata } from 'next'
import InitManager from '@/components/admin/InitManager'

export const metadata: Metadata = {
  title: '系统初始化',
  description: '初始化系统基础数据',
}

export default function InitPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">系统初始化</h1>
      <InitManager />
    </div>
  )
}
