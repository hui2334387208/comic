import { Metadata } from 'next';
import ClientDailyPracticePage from './ClientDailyPracticePage';

export const metadata: Metadata = {
  title: '每日一练 - 对联学院',
  description: '坚持每日练习，包括填空、改错、创作等多种题型',
};

interface DailyPracticePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function DailyPracticePage({ params }: DailyPracticePageProps) {
  const { locale } = await params;
  return <ClientDailyPracticePage locale={locale} />;
}