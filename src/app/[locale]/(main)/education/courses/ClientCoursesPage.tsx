'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Link } from '@/i18n/navigation';

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string;
  duration: number;
  order: number;
  isPublished: boolean;
  learningObjectives: string[];
  prerequisites: string[];
}

interface UserProgress {
  courseId: string;
  status: string;
  progress: number;
  completedAt?: string;
}

interface ClientCoursesPageProps {
  locale: string;
}

export default function ClientCoursesPage({ locale }: ClientCoursesPageProps) {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/education/courses');
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.data.courses || []);
        setUserProgress(data.data.userProgress || []);
      }
    } catch (error) {
      console.error('获取课程数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'from-green-500 to-green-600';
      case 'intermediate': return 'from-blue-500 to-blue-600';
      case 'advanced': return 'from-purple-500 to-purple-600';
      case 'expert': return 'from-red-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner': return '入门';
      case 'intermediate': return '进阶';
      case 'advanced': return '高级';
      case 'expert': return '专家';
      default: return '未知';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'basic': return '基础知识';
      case 'rhythm': return '韵律技巧';
      case 'theme': return '主题创作';
      case 'advanced': return '高级技法';
      default: return category;
    }
  };

  const getUserProgress = (courseId: string) => {
    return userProgress.find(p => p.courseId === courseId);
  };

  const filteredCourses = selectedLevel === 'all' 
    ? courses 
    : courses.filter(course => course.level === selectedLevel);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">📚</div>
          <div className="text-red-600 font-bold text-xl">加载课程中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 relative overflow-hidden">
      {/* 传统装饰背景 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 border-4 border-red-600 rounded-full"></div>
        <div className="absolute top-20 right-20 w-24 h-24 border-2 border-red-500 rotate-45"></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 border-3 border-red-400 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-20 h-20 border-2 border-red-600 rotate-12"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h1 className="text-5xl font-black text-red-700 mb-4 relative">
              系统课程
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full opacity-80"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-orange-600 rounded-full opacity-60"></div>
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
          </div>
          <p className="text-red-600 text-lg font-bold mt-6 max-w-2xl mx-auto leading-relaxed">
            从基础到高级的完整学习路径，系统性掌握对联知识
          </p>
        </div>

        {/* 返回按钮 */}
        <div className="mb-8">
          <Link 
            href="/education" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors shadow-lg"
          >
            ← 返回对联学院
          </Link>
        </div>

        {/* 筛选器 */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setSelectedLevel('all')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                selectedLevel === 'all'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-white text-red-600 border-2 border-red-200 hover:border-red-400'
              }`}
            >
              全部课程
            </button>
            <button
              onClick={() => setSelectedLevel('beginner')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                selectedLevel === 'beginner'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-white text-green-600 border-2 border-green-200 hover:border-green-400'
              }`}
            >
              入门课程
            </button>
            <button
              onClick={() => setSelectedLevel('intermediate')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                selectedLevel === 'intermediate'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-blue-600 border-2 border-blue-200 hover:border-blue-400'
              }`}
            >
              进阶课程
            </button>
            <button
              onClick={() => setSelectedLevel('advanced')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                selectedLevel === 'advanced'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-purple-600 border-2 border-purple-200 hover:border-purple-400'
              }`}
            >
              高级课程
            </button>
          </div>
        </div>

        {/* 课程列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => {
            const progress = getUserProgress(course.id);
            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl p-6 shadow-xl border-4 border-red-200 hover:border-red-400 transition-all duration-300 hover:shadow-2xl group"
              >
                {/* 课程头部 */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`px-3 py-1 rounded-full text-white text-sm font-bold bg-gradient-to-r ${getLevelColor(course.level)}`}>
                    {getLevelText(course.level)}
                  </div>
                  <div className="text-red-600 text-sm font-bold">
                    {getCategoryText(course.category)}
                  </div>
                </div>

                {/* 课程标题 */}
                <h3 className="text-xl font-black text-red-700 mb-3 group-hover:text-red-800 transition-colors">
                  {course.title}
                </h3>

                {/* 课程描述 */}
                <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
                  {course.description}
                </p>

                {/* 学习目标 */}
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-red-600 mb-2">学习目标：</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {course.learningObjectives.slice(0, 2).map((objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>{objective}</span>
                      </li>
                    ))}
                    {course.learningObjectives.length > 2 && (
                      <li className="text-red-500 text-xs">
                        +{course.learningObjectives.length - 2} 个目标...
                      </li>
                    )}
                  </ul>
                </div>

                {/* 课程信息 */}
                <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>⏱️</span>
                    <span>{course.duration}分钟</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📋</span>
                    <span>第{course.order}课</span>
                  </div>
                </div>

                {/* 进度条 */}
                {progress && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">学习进度</span>
                      <span className="text-red-600 font-bold">{Math.round(progress.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      状态: {progress.status === 'completed' ? '已完成' : progress.status === 'in_progress' ? '学习中' : '未开始'}
                    </div>
                  </div>
                )}

                {/* 前置课程 */}
                {course.prerequisites.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-orange-600 font-bold mb-1">前置要求：</div>
                    <div className="text-xs text-gray-600">
                      需完成: {course.prerequisites.join(', ')}
                    </div>
                  </div>
                )}

                {/* 开始学习按钮 */}
                <Link
                  href={`/education/courses/${course.id}`}
                  className="block w-full text-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {progress?.status === 'completed' ? '复习课程' : progress?.status === 'in_progress' ? '继续学习' : '开始学习'}
                </Link>
              </div>
            );
          })}
        </div>

        {/* 空状态 */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <div className="text-red-600 font-bold text-xl mb-2">暂无课程</div>
            <div className="text-gray-600">该难度级别暂时没有可用课程</div>
          </div>
        )}

        {/* 底部装饰 */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-6 bg-red-600 text-white px-8 py-4 rounded-full shadow-xl">
            <span className="text-2xl">📚</span>
            <span className="font-bold text-lg">系统学习，循序渐进</span>
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