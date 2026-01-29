'use client'

import MenuManager from '@/components/admin/MenuManager'
import { withPagePermission } from '@/lib/withPagePermission'
import { useTranslations } from 'next-intl'

function MenusPage() {
  const t = useTranslations('admin.sidebar')
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('menuManagement')}</h1>
      <MenuManager />
    </div>
  )
}

// 使用页面级权限校验
export default withPagePermission(MenusPage, {
  permission: 'menu.read'
})
