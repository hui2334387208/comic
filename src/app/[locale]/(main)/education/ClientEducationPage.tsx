'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Link } from '@/i18n/navigation';

interface EducationStats {
  courses: number;
  exercises: number;
  learningPaths: number;
  badges: number;
  userProgress?: {
    coursesCompleted: number;
    exercisesCompleted: number;
    currentStreak: number;
    totalStudyTime: number;
    level: number;
    experience: number;
  };
}

interface ClientEducationPageProps {
  locale: string;
}

export default function ClientEducationPage({ locale }: ClientEducationPageProps) {
  const { data: session } = useSession();
  const [stats, setStats] = useState<EducationStats>({
    courses: 0,
    exercises: 0,
    learningPaths: 0,
    badges: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // 获取教育模块统计数据
      const response = await fetch('/api/admin/init-education');
      const data = await response.json();
      
      if (data.success) {
        setStats({
          courses: data.data.courses || 0,
          exercises: data.data.exercises || 0,
          learningPaths: data.data.learningPaths || 0,
          badges: data.data.badges || 0
        });
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 relative overflow-hidden">
      {/* 传统装饰背景 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 border-4 border-red-600 rounded-full"></div>
        <div className="absolute top-20 right-20 w-24 h-24 border-2 border-red-500 rotate-45"></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 border-3 border-red-400 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-20 h-20 border-2 border-red-600 rotate-12"></div>
        {/* 传统云纹装饰 */}
        <div className="absolute top-1/4 left-1/4 w-16 h-8 bg-red-300 rounded-full opacity-20"></div>
        <div className="absolute top-1/3 right-1/3 w-20 h-10 bg-red-400 rounded-full opacity-20"></div>
        <div className="absolute bottom-1/4 right-1/4 w-18 h-9 bg-red-500 rounded-full opacity-20"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* 页面标题 - 中国风设计 */}
        <div className="text-center mb-16">
          <div className="relative inline-block">
            <h1 className="text-6xl font-black text-red-700 mb-4 relative">
              对联学院
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full opacity-80"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-orange-600 rounded-full opacity-60"></div>
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
          </div>
          <p className="text-red-600 text-xl font-bold mt-8 max-w-3xl mx-auto leading-relaxed">
            系统性学习对联知识，从基础到高级的完整学习路径，传承中华文化精髓
          </p>
          <div className="flex justify-center items-center gap-4 mt-6">
            <div className="w-16 h-0.5 bg-red-600"></div>
            <span className="text-red-700 font-bold text-lg">📚 传承文化 📚</span>
            <div className="w-16 h-0.5 bg-red-600"></div>
          </div>
        </div>

        {/* 用户学习数据概览 */}
        {session?.user && stats.userProgress && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-4 text-white text-center shadow-lg">
              <div className="text-2xl mb-2">📚</div>
              <div className="text-sm text-red-200">完成课程</div>
              <div className="text-xl font-bold">{stats.userProgress.coursesCompleted}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl p-4 text-white text-center shadow-lg">
              <div className="text-2xl mb-2">✏️</div>
              <div className="text-sm text-orange-200">练习题数</div>
              <div className="text-xl font-bold">{stats.userProgress.exercisesCompleted}</div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white text-center shadow-lg">
              <div className="text-2xl mb-2">🔥</div>
              <div className="text-sm text-red-200">连续天数</div>
              <div className="text-xl font-bold">{stats.userProgress.currentStreak}天</div>
            </div>
            <div className="bg-gradient-to-br from-red-700 to-red-800 rounded-xl p-4 text-white text-center shadow-lg">
              <div className="text-2xl mb-2">⏰</div>
              <div className="text-sm text-red-200">学习时长</div>
              <div className="text-xl font-bold">{Math.floor(stats.userProgress.totalStudyTime / 60)}h</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-4 text-white text-center shadow-lg">
              <div className="text-2xl mb-2">🏆</div>
              <div className="text-sm text-yellow-200">当前等级</div>
              <div className="text-xl font-bold">Lv.{stats.userProgress.level}</div>
            </div>
            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-4 text-white text-center shadow-lg">
              <div className="text-2xl mb-2">⭐</div>
              <div className="text-sm text-red-200">经验值</div>
              <div className="text-lg font-bold">{stats.userProgress.experience}</div>
            </div>
          </div>
        )}

        {/* 功能入口卡片 - 中国风红色主题 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {/* 系统课程 */}
          <Link href="/education/courses" className="group">
            <div className="relative bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-8 text-white shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-red-500 hover:border-red-400">
              <div className="absolute top-4 right-4 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-2xl">
                📚
              </div>
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full"></div>
              
              <h3 className="text-2xl font-black mb-4 group-hover:text-yellow-200 transition-colors">
                系统课程
              </h3>
              <p className="text-red-100 mb-6 leading-relaxed">
                从基础到高级的完整学习路径，系统性掌握对联知识
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="text-red-200">可用课程</div>
                  <div className="text-xl font-bold">{loading ? '...' : stats.courses}门</div>
                </div>
                <div className="bg-red-500 rounded-full p-3 group-hover:bg-red-400 transition-colors">
                  <span className="text-lg">📖</span>
                </div>
              </div>
            </div>
          </Link>

          {/* 每日一练 */}
          <Link href="/education/daily-practice" className="group">
            <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-8 text-white shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-red-400 hover:border-red-300">
              <div className="absolute top-4 right-4 w-12 h-12 bg-red-400 rounded-full flex items-center justify-center text-2xl">
                🏆
              </div>
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-orange-400 rounded-full"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-orange-500 rounded-full"></div>
              
              <h3 className="text-2xl font-black mb-4 group-hover:text-yellow-200 transition-colors">
                每日一练
              </h3>
              <p className="text-red-100 mb-6 leading-relaxed">
                坚持每日练习，包括填空、改错、创作等多种题型
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="text-red-200">练习题库</div>
                  <div className="text-xl font-bold">{loading ? '...' : stats.exercises}题</div>
                </div>
                <div className="bg-red-400 rounded-full p-3 group-hover:bg-red-300 transition-colors">
                  <span className="text-lg">✏️</span>
                </div>
              </div>
            </div>
          </Link>

          {/* AI导师 */}
          <Link href="/education/ai-tutor" className="group">
            <div className="relative bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-8 text-white shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-orange-500 hover:border-orange-400">
              <div className="absolute top-4 right-4 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-2xl">
                🤖
              </div>
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-400 rounded-full"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-red-500 rounded-full"></div>
              
              <h3 className="text-2xl font-black mb-4 group-hover:text-yellow-200 transition-colors">
                AI导师
              </h3>
              <p className="text-orange-100 mb-6 leading-relaxed">
                个性化学习路径推荐和实时指导，智能答疑解惑
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="text-orange-200">智能指导</div>
                  <div className="text-xl font-bold">24/7</div>
                </div>
                <div className="bg-orange-500 rounded-full p-3 group-hover:bg-orange-400 transition-colors">
                  <span className="text-lg">🧠</span>
                </div>
              </div>
            </div>
          </Link>

          {/* 成就系统 */}
          <Link href="/education/achievements" className="group">
            <div className="relative bg-gradient-to-br from-red-700 to-red-800 rounded-2xl p-8 text-white shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-red-600 hover:border-red-500">
              <div className="absolute top-4 right-4 w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-2xl">
                ⭐
              </div>
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full"></div>
              
              <h3 className="text-2xl font-black mb-4 group-hover:text-yellow-200 transition-colors">
                成就系统
              </h3>
              <p className="text-red-100 mb-6 leading-relaxed">
                解锁学习徽章，展示学习成果，激励持续学习
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="text-red-200">可获徽章</div>
                  <div className="text-xl font-bold">{loading ? '...' : stats.badges}个</div>
                </div>
                <div className="bg-red-600 rounded-full p-3 group-hover:bg-red-500 transition-colors">
                  <span className="text-lg">🏅</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* 学习路径推荐 */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border-4 border-red-200 mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl">
              🗺️
            </div>
            <h3 className="text-2xl font-bold text-red-700">推荐学习路径</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/education/paths/beginner" className="group">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 hover:border-green-400 transition-all duration-300 group-hover:shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-lg">
                    🌱
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-green-700">对联入门学习路径</h4>
                    <p className="text-green-600 text-sm">适合零基础学员</p>
                  </div>
                </div>
                <p className="text-green-700 text-sm leading-relaxed">
                  从基础知识到简单创作，循序渐进地掌握对联技能，预计学习时间30天
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-green-600 text-sm">包含2门课程</span>
                  <span className="text-green-500 group-hover:text-green-600 transition-colors">→</span>
                </div>
              </div>
            </Link>

            <Link href="/education/paths/advanced" className="group">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 group-hover:shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg">
                    🚀
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-blue-700">对联创作提升路径</h4>
                    <p className="text-blue-600 text-sm">适合有基础的学员</p>
                  </div>
                </div>
                <p className="text-blue-700 text-sm leading-relaxed">
                  重点提升创作技巧和艺术水平，学会创作各种主题的对联，预计学习时间45天
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-blue-600 text-sm">包含2门课程</span>
                  <span className="text-blue-500 group-hover:text-blue-600 transition-colors">→</span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* 底部装饰 - 中国风元素 */}
        <div className="text-center">
          <div className="inline-flex items-center gap-6 bg-red-600 text-white px-8 py-4 rounded-full shadow-xl">
            <span className="text-2xl">📚</span>
            <span className="font-bold text-lg">传承千年文化，掌握对联艺术</span>
            <span className="text-2xl">📚</span>
          </div>
        </div>
      </div>

      {/* 浮动装饰元素 */}
      <div className="absolute top-1/4 left-8 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 right-12 w-3 h-3 bg-orange-500 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute bottom-1/4 left-16 w-2 h-2 bg-red-600 rounded-full animate-pulse delay-2000"></div>
      <div className="absolute bottom-1/3 right-8 w-3 h-3 bg-red-400 rounded-full animate-pulse delay-3000"></div>
    </div>
  );
}