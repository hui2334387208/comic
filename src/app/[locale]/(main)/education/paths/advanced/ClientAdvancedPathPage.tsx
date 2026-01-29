'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Link } from '@/i18n/navigation';

interface PathStep {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'exercise' | 'milestone' | 'project';
  duration: number;
  isCompleted: boolean;
  isLocked: boolean;
  order: number;
  difficulty: string;
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  level: string;
  estimatedDuration: number;
  steps: PathStep[];
  progress: number;
  completedSteps: number;
  totalSteps: number;
  prerequisites: string[];
}

interface ClientAdvancedPathPageProps {
  locale: string;
}

export default function ClientAdvancedPathPage({ locale }: ClientAdvancedPathPageProps) {
  const { data: session } = useSession();
  const [pathData, setPathData] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPathData();
  }, []);

  const fetchPathData = async () => {
    try {
      setLoading(true);
      // 模拟API调用 - 实际应该从后端获取
      const mockPathData: LearningPath = {
        id: 'advanced-path',
        name: '对联创作提升路径',
        description: '适合有一定基础的学员，重点提升创作技巧和艺术水平，学会创作各种主题的对联',
        level: 'intermediate',
        estimatedDuration: 45,
        progress: 20,
        completedSteps: 2,
        totalSteps: 10,
        prerequisites: ['对联基础知识', '平仄规律'],
        steps: [
          {
            id: 'step-1',
            title: '高级平仄技巧',
            description: '深入学习复杂的平仄搭配和声律美学',
            type: 'course',
            duration: 120,
            isCompleted: true,
            isLocked: false,
            order: 1,
            difficulty: 'medium'
          },
          {
            id: 'step-2',
            title: '平仄高级练习',
            description: '通过复杂对联分析平仄运用技巧',
            type: 'exercise',
            duration: 90,
            isCompleted: true,
            isLocked: false,
            order: 2,
            difficulty: 'medium'
          },
          {
            id: 'step-3',
            title: '修辞手法运用',
            description: '学习对偶、排比、比喻等修辞技法',
            type: 'course',
            duration: 150,
            isCompleted: false,
            isLocked: false,
            order: 3,
            difficulty: 'hard'
          },
          {
            id: 'step-4',
            title: '修辞技法练习',
            description: '创作运用各种修辞手法的对联',
            type: 'exercise',
            duration: 120,
            isCompleted: false,
            isLocked: true,
            order: 4,
            difficulty: 'hard'
          },
          {
            id: 'milestone-1',
            title: '中级技能测试',
            description: '综合测试平仄和修辞技法掌握情况',
            type: 'milestone',
            duration: 90,
            isCompleted: false,
            isLocked: true,
            order: 5,
            difficulty: 'hard'
          },
          {
            id: 'step-5',
            title: '主题对联创作',
            description: '学习不同主题对联的创作方法',
            type: 'course',
            duration: 180,
            isCompleted: false,
            isLocked: true,
            order: 6,
            difficulty: 'hard'
          },
          {
            id: 'project-1',
            title: '节庆对联创作项目',
            description: '为传统节日创作系列主题对联',
            type: 'project',
            duration: 240,
            isCompleted: false,
            isLocked: true,
            order: 7,
            difficulty: 'hard'
          },
          {
            id: 'step-6',
            title: '名家作品赏析',
            description: '深入分析古今名家对联作品',
            type: 'course',
            duration: 120,
            isCompleted: false,
            isLocked: true,
            order: 8,
            difficulty: 'expert'
          },
          {
            id: 'project-2',
            title: '个人风格探索',
            description: '发展个人创作风格，完成原创作品集',
            type: 'project',
            duration: 300,
            isCompleted: false,
            isLocked: true,
            order: 9,
            difficulty: 'expert'
          },
          {
            id: 'milestone-2',
            title: '创作大师认证',
            description: '最终考核，获得创作大师认证',
            type: 'milestone',
            duration: 180,
            isCompleted: false,
            isLocked: true,
            order: 10,
            difficulty: 'expert'
          }
        ]
      };
      
      setPathData(mockPathData);
    } catch (error) {
      console.error('获取学习路径数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (type: string, isCompleted: boolean, isLocked: boolean) => {
    if (isLocked) return '🔒';
    if (isCompleted) return '✅';
    
    switch (type) {
      case 'course': return '📚';
      case 'exercise': return '✏️';
      case 'milestone': return '🏆';
      case 'project': return '🎨';
      default: return '📋';
    }
  };

  const getStepTypeText = (type: string) => {
    switch (type) {
      case 'course': return '课程';
      case 'exercise': return '练习';
      case 'milestone': return '里程碑';
      case 'project': return '项目';
      default: return type;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'medium': return 'bg-yellow-100 text-yellow-600';
      case 'hard': return 'bg-orange-100 text-orange-600';
      case 'expert': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'medium': return '中等';
      case 'hard': return '困难';
      case 'expert': return '专家';
      default: return difficulty;
    }
  };

  const getStepColor = (type: string, isCompleted: boolean, isLocked: boolean) => {
    if (isLocked) return 'from-gray-400 to-gray-500';
    if (isCompleted) return 'from-green-500 to-green-600';
    
    switch (type) {
      case 'course': return 'from-blue-500 to-blue-600';
      case 'exercise': return 'from-orange-500 to-orange-600';
      case 'milestone': return 'from-purple-500 to-purple-600';
      case 'project': return 'from-pink-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🚀</div>
          <div className="text-red-600 font-bold text-xl">加载提升路径中...</div>
        </div>
      </div>
    );
  }

  if (!pathData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-red-600 font-bold text-xl mb-4">获取学习路径失败</div>
          <button 
            onClick={fetchPathData}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
          >
            重新加载
          </button>
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

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h1 className="text-5xl font-black text-red-700 mb-4 relative">
              {pathData.name}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full opacity-80"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-full opacity-60"></div>
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-blue-600 to-blue-500"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
          </div>
          <p className="text-blue-600 text-lg font-bold mt-6 max-w-3xl mx-auto leading-relaxed">
            {pathData.description}
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

        {/* 前置要求提醒 */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-8 rounded-r-xl">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="text-yellow-800 font-bold mb-2">前置要求</h3>
              <p className="text-yellow-700 mb-3">
                此学习路径适合已掌握基础知识的学员，建议先完成以下内容：
              </p>
              <ul className="space-y-1">
                {pathData.prerequisites.map((prereq, index) => (
                  <li key={index} className="text-yellow-700 flex items-center gap-2">
                    <span className="text-yellow-500">•</span>
                    <span>{prereq}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 路径统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-sm text-blue-200">总体进度</div>
            <div className="text-xl font-bold">{Math.round(pathData.progress)}%</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-sm text-purple-200">完成步骤</div>
            <div className="text-xl font-bold">{pathData.completedSteps}/{pathData.totalSteps}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">⏱️</div>
            <div className="text-sm text-orange-200">预计时长</div>
            <div className="text-xl font-bold">{pathData.estimatedDuration}天</div>
          </div>
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">🚀</div>
            <div className="text-sm text-red-200">难度等级</div>
            <div className="text-xl font-bold">进阶</div>
          </div>
        </div>

        {/* 总体进度条 */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-blue-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-blue-700">学习进度</h3>
            <span className="text-blue-600 font-bold">{Math.round(pathData.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${pathData.progress}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600 mt-2">
            已完成 {pathData.completedSteps} 个步骤，还有 {pathData.totalSteps - pathData.completedSteps} 个步骤待完成
          </div>
        </div>

        {/* 学习步骤 */}
        <div className="space-y-6">
          {pathData.steps.map((step, index) => (
            <div
              key={step.id}
              className={`relative bg-white rounded-2xl p-6 shadow-xl border-4 transition-all duration-300 hover:shadow-2xl ${
                step.isCompleted 
                  ? 'border-green-400' 
                  : step.isLocked 
                    ? 'border-gray-300' 
                    : 'border-blue-400'
              } ${step.isLocked ? 'opacity-60' : ''}`}
            >
              {/* 步骤连接线 */}
              {index < pathData.steps.length - 1 && (
                <div className="absolute left-8 top-20 w-0.5 h-16 bg-gray-300 z-0"></div>
              )}

              <div className="relative z-10">
                {/* 步骤头部 */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl bg-gradient-to-br ${getStepColor(step.type, step.isCompleted, step.isLocked)} text-white shadow-lg`}>
                    {getStepIcon(step.type, step.isCompleted, step.isLocked)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        step.isCompleted 
                          ? 'bg-green-100 text-green-600'
                          : step.isLocked
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-blue-100 text-blue-600'
                      }`}>
                        第{step.order}步 · {getStepTypeText(step.type)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getDifficultyColor(step.difficulty)}`}>
                        {getDifficultyText(step.difficulty)}
                      </span>
                      <span className="text-gray-600 text-sm">
                        ⏱️ {step.duration}分钟
                      </span>
                      {step.isCompleted && (
                        <span className="text-green-600 text-sm font-bold">
                          ✅ 已完成
                        </span>
                      )}
                      {step.isLocked && (
                        <span className="text-gray-500 text-sm">
                          🔒 未解锁
                        </span>
                      )}
                    </div>
                    
                    <h3 className={`text-xl font-black mb-2 ${
                      step.isCompleted 
                        ? 'text-green-700'
                        : step.isLocked
                          ? 'text-gray-500'
                          : step.type === 'project'
                            ? 'text-pink-700'
                            : step.type === 'milestone'
                              ? 'text-purple-700'
                              : 'text-blue-700'
                    }`}>
                      {step.title}
                    </h3>
                    
                    <p className={`leading-relaxed ${
                      step.isLocked ? 'text-gray-500' : 'text-gray-700'
                    }`}>
                      {step.description}
                    </p>

                    {/* 项目特殊说明 */}
                    {step.type === 'project' && !step.isLocked && (
                      <div className="mt-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
                        <div className="text-pink-700 text-sm font-bold mb-1">💡 项目说明：</div>
                        <div className="text-pink-600 text-sm">
                          这是一个实践项目，需要您运用所学知识完成创作任务，导师将提供个性化指导。
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end">
                  {step.isCompleted ? (
                    <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors shadow-lg">
                      复习内容
                    </button>
                  ) : step.isLocked ? (
                    <button 
                      disabled
                      className="px-6 py-3 bg-gray-400 text-white rounded-lg font-bold cursor-not-allowed"
                    >
                      完成前置步骤解锁
                    </button>
                  ) : step.type === 'project' ? (
                    <button className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-bold transition-colors shadow-lg">
                      开始项目
                    </button>
                  ) : step.type === 'milestone' ? (
                    <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors shadow-lg">
                      参加测试
                    </button>
                  ) : (
                    <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-lg">
                      开始学习
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 完成奖励 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center shadow-xl mt-12">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="text-2xl font-black mb-4">完成路径获得认证</h3>
          <p className="text-blue-100 text-lg mb-6">
            完成整个提升学习路径后，您将获得：
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-500 rounded-xl p-4">
              <div className="text-2xl mb-2">🎓</div>
              <div className="font-bold">创作大师证书</div>
              <div className="text-blue-100 text-sm">官方高级认证</div>
            </div>
            <div className="bg-purple-500 rounded-xl p-4">
              <div className="text-2xl mb-2">👑</div>
              <div className="font-bold">大师徽章</div>
              <div className="text-purple-100 text-sm">对联创作大师</div>
            </div>
            <div className="bg-pink-500 rounded-xl p-4">
              <div className="text-2xl mb-2">📚</div>
              <div className="font-bold">作品集</div>
              <div className="text-pink-100 text-sm">个人创作集</div>
            </div>
            <div className="bg-orange-500 rounded-xl p-4">
              <div className="text-2xl mb-2">⭐</div>
              <div className="font-bold">经验奖励</div>
              <div className="text-orange-100 text-sm">1500经验值</div>
            </div>
          </div>
        </div>

        {/* 底部装饰 */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-6 bg-blue-600 text-white px-8 py-4 rounded-full shadow-xl">
            <span className="text-2xl">🚀</span>
            <span className="font-bold text-lg">精进技艺，追求卓越</span>
            <span className="text-2xl">🚀</span>
          </div>
        </div>
      </div>

      {/* 浮动装饰元素 */}
      <div className="absolute top-1/4 left-8 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 right-12 w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute bottom-1/4 left-16 w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-2000"></div>
      <div className="absolute bottom-1/3 right-8 w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-3000"></div>
    </div>
  );
}