'use client'

import { withPagePermission } from '@/lib/withPagePermission'

function DashboardPage() {
  return (
    <div>
      dashboard
    </div>
  )
}

// 使用页面级权限校验
export default withPagePermission(DashboardPage, {
  permission: 'dashboard.read'
})
