import { Metadata } from 'next';
import ClientCoursesPage from './ClientCoursesPage';

export const metadata: Metadata = {
  title: '系统课程 - 对联学院',
  description: '从基础到高级的完整学习路径，系统性掌握对联知识',
};

interface CoursesPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function CoursesPage({ params }: CoursesPageProps) {
  const { locale } = await params;
  return <ClientCoursesPage locale={locale} />;
}