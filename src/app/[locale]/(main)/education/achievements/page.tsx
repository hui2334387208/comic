import { Metadata } from 'next';
import ClientAchievementsPage from './ClientAchievementsPage';

export const metadata: Metadata = {
  title: '成就系统 - 对联学院',
  description: '解锁学习徽章，展示学习成果，激励持续学习',
};

interface AchievementsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AchievementsPage({ params }: AchievementsPageProps) {
  const { locale } = await params;
  return <ClientAchievementsPage locale={locale} />;
}