'use client'

import { GlobalOutlined } from '@ant-design/icons'
import { Button, Dropdown, MenuProps } from 'antd'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import React from 'react'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
]

export default function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('main.navigation')

  const currentLang = languages.find(lang => lang.code === locale) || languages[0]

  const handleLanguageChange = (locale: string) => {
    router.push(pathname, { locale })
  }

  const menuItems: MenuProps['items'] = languages.map(lang => ({
    key: lang.code,
    label: (
      <div className="flex items-center space-x-2">
        <span className="text-lg">{lang.flag}</span>
        <span>{lang.name}</span>
      </div>
    ),
    onClick: () => handleLanguageChange(lang.code),
  }))

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
      <Button
        type="text"
        icon={<GlobalOutlined />}
        className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
        title={t('changeLanguage')}
      >
        <span className="mr-1">{currentLang.flag}</span>
        <span className="hidden md:inline">{currentLang.name}</span>
      </Button>
    </Dropdown>
  )
} 