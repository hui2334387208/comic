'use client'

import InitManager from '@/components/admin/InitManager'

export default function AdminHome() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <InitManager />
      </div>
    </div>
  )
}
