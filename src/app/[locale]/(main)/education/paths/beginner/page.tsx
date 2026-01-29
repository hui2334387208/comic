import { Metadata } from 'next';
import ClientBeginnerPathPage from './ClientBeginnerPathPage';

export const metadata: Metadata = {
  title: '对联入门学习路径 - 对联学院',
  description: '适合零基础学员的完整学习路径，从基础知识到简单创作',
};

interface BeginnerPathPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function BeginnerPathPage({ params }: BeginnerPathPageProps) {
  const { locale } = await params;
  return <ClientBeginnerPathPage locale={locale} />;
}