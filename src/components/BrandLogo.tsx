import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function BrandLogo({ className = '' }: { className?: string }) {
  const tCommon = useTranslations('main.common')
  return (
    <Link href="/" className={`flex items-center space-x-2 ${className} hover:opacity-80 transition-opacity duration-200`}>
      <img src="/logo.jpg" alt="Logo" className="w-12 h-12 rounded-lg object-cover" />
      <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
        {tCommon('siteName')}
      </span>
    </Link>
  )
} 