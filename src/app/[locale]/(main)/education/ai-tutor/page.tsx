import { Metadata } from 'next';
import ClientAITutorPage from './ClientAITutorPage';

export const metadata: Metadata = {
  title: 'AI导师 - 对联学院',
  description: '个性化学习路径推荐和实时指导，智能答疑解惑',
};

interface AITutorPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AITutorPage({ params }: AITutorPageProps) {
  const { locale } = await params;
  return <ClientAITutorPage locale={locale} />;
}