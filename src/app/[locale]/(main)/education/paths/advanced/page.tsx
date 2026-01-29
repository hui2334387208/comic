import { Metadata } from 'next';
import ClientAdvancedPathPage from './ClientAdvancedPathPage';

export const metadata: Metadata = {
  title: '对联创作提升路径 - 对联学院',
  description: '适合有基础的学员，重点提升创作技巧和艺术水平',
};

interface AdvancedPathPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AdvancedPathPage({ params }: AdvancedPathPageProps) {
  const { locale } = await params;
  return <ClientAdvancedPathPage locale={locale} />;
}