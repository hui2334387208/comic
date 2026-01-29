import React from 'react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ClientEducationPage from './ClientEducationPage';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations('education');
  
  return {
    title: `${t('title')} - 对联学院`,
    description: t('description'),
    keywords: '对联学习,中国传统文化,诗词教育,AI导师,每日练习',
  };
}

export default async function EducationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ClientEducationPage locale={locale} />;
}