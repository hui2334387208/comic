'use client'

import { SessionProvider } from 'next-auth/react'
import { NextIntlClientProvider } from 'next-intl'
import { ReactNode } from 'react'
import GlobalMessage from '@/components/common/GlobalMessage'

export default function Providers({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: string;
  messages: any;
}) {
  return (
    <SessionProvider>
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone="Asia/Shanghai"
      >
        <GlobalMessage />
        {children}
      </NextIntlClientProvider>
    </SessionProvider>
  )
}
