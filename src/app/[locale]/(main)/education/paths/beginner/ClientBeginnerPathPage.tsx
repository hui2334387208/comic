'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Link } from '@/i18n/navigation';

interface PathStep {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'exercise' | 'milestone';
  duration: number;
  isCompleted: boolean;
  isLocked: boolean;
  order: number;
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
}

interface ClientBeginnerPathPageProps {
  locale: string;
}

export default function ClientBeginnerPathPage({ locale }: ClientBeginnerPathPageProps) {
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
        id: 'beginner-path',
        name: '对联入门学习路径',
        description: '适合零基础学员的完整学习路径，从基础知识到简单创作，循序渐进地掌握对联技能',
        level: 'beginner',
        estimatedDuration: 30,
        progress: 35,
        completedSteps: 3,
        totalSteps: 8,
        steps: [
          {
            id: 'step-1',
            title: '对联基础知识',
            description: '了解对联的历史起源、基本概念和文化背景',
            type: 'course',
            duration: 60,
            isCompleted: true,
            isLocked: false,
            order: 1
          },
          {
            id: 'step-2',
            title: '基础练习 - 认识对联',
            description: '通过练习题加深对对联基本概念的理解',
            type: 'exercise',
            duration: 30,
            isCompleted: true,
            isLocked: false,
            order: 2
          },
          {
            id: 'step-3',
            title: '对联格律入门',
            description: '学习对联的基本格律要求和规则',
            type: 'course',
            duration: 90,
            isCompleted: true,
            isLocked: false,
            order: 3
          },
          {
            id: 'step-4',
            title: '格律练习',
            description: '通过填空和选择题练习格律知识',
            type: 'exercise',
            duration: 45,
            isCompleted: false,
            isLocked: false,
            order: 4
          },
          {
            id: 'milestone-1',
            title: '阶段测试 - 基础知识',
            description: '测试对基础知识和格律的掌握程度',
            type: 'milestone',
            duration: 60,
            isCompleted: false,
            isLocked: false,
            order: 5
          },
          {
            id: 'step-5',
            title: '简单对联创作',
            description: '学习创作简单对联的方法和技巧',
            type: 'course',
            duration: 120,
            isCompleted: false,
            isLocked: true,
            order: 6
          },
          {
            id: 'step-6',
            title: '创作练习',
            description: '尝试创作自己的第一副对联',
            type: 'exercise',
            duration: 90,
            isCompleted: false,
            isLocked: true,
            order: 7
          },
          {
            id: 'milestone-2',
            title: '入门毕业测试',
            description: '综合测试，完成后获得入门证书',
            type: 'milestone',
            duration: 90,
            isCompleted: false,
            isLocked: true,
            order: 8
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
      default: return '📋';
    }
  };

  const getStepTypeText = (type: string) => {
    switch (type) {
      case 'course': return '课程';
      case 'exercise': return '练习';
      case 'milestone': return '里程碑';
      default: return type;
    }
  };

  const getStepColor = (type: string, isCompleted: boolean, isLocked: boolean) => {
    if (isLocked) return 'from-gray-400 to-gray-500';
    if (isCompleted) return 'from-green-500 to-green-600';
    
    switch (type) {
      case 'course': return 'from-blue-500 to-blue-600';
      case 'exercise': return 'from-orange-500 to-orange-600';
      case 'milestone': return 'from-purple-500 to-purple-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🗺️</div>
          <div className="text-red-600 font-bold text-xl">加载学习路径中...</div>
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
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-600 rounded-full opacity-80"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-green-500 rounded-full opacity-60"></div>
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-green-600 to-green-500"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
          </div>
          <p className="text-green-600 text-lg font-bold mt-6 max-w-3xl mx-auto leading-relaxed">
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

        {/* 路径统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-sm text-green-200">总体进度</div>
            <div className="text-xl font-bold">{Math.round(pathData.progress)}%</div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-sm text-blue-200">完成步骤</div>
            <div className="text-xl font-bold">{pathData.completedSteps}/{pathData.totalSteps}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">⏱️</div>
            <div className="text-sm text-orange-200">预计时长</div>
            <div className="text-xl font-bold">{pathData.estimatedDuration}天</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">🌱</div>
            <div className="text-sm text-purple-200">难度等级</div>
            <div className="text-xl font-bold">入门</div>
          </div>
        </div>

        {/* 总体进度条 */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-green-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-green-700">学习进度</h3>
            <span className="text-green-600 font-bold">{Math.round(pathData.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-300"
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
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        step.isCompleted 
                          ? 'bg-green-100 text-green-600'
                          : step.isLocked
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-blue-100 text-blue-600'
                      }`}>
                        第{step.order}步 · {getStepTypeText(step.type)}
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
                          : 'text-blue-700'
                    }`}>
                      {step.title}
                    </h3>
                    
                    <p className={`leading-relaxed ${
                      step.isLocked ? 'text-gray-500' : 'text-gray-700'
                    }`}>
                      {step.description}
                    </p>
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
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white text-center shadow-xl mt-12">
          <div className="text-4xl mb-4">🎓</div>
          <h3 className="text-2xl font-black mb-4">完成路径获得奖励</h3>
          <p className="text-green-100 text-lg mb-6">
            完成整个入门学习路径后，您将获得：
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-500 rounded-xl p-4">
              <div className="text-2xl mb-2">🏆</div>
              <div className="font-bold">入门证书</div>
              <div className="text-green-100 text-sm">官方认证证书</div>
            </div>
            <div className="bg-green-500 rounded-xl p-4">
              <div className="text-2xl mb-2">🌟</div>
              <div className="font-bold">专属徽章</div>
              <div className="text-green-100 text-sm">对联入门者徽章</div>
            </div>
            <div className="bg-green-500 rounded-xl p-4">
              <div className="text-2xl mb-2">🎁</div>
              <div className="font-bold">经验奖励</div>
              <div className="text-green-100 text-sm">500经验值</div>
            </div>
          </div>
        </div>

        {/* 底部装饰 */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-6 bg-green-600 text-white px-8 py-4 rounded-full shadow-xl">
            <span className="text-2xl">🗺️</span>
            <span className="font-bold text-lg">循序渐进，稳步提升</span>
            <span className="text-2xl">🗺️</span>
          </div>
        </div>
      </div>

      {/* 浮动装饰元素 */}
      <div className="absolute top-1/4 left-8 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 right-12 w-3 h-3 bg-green-400 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute bottom-1/4 left-16 w-2 h-2 bg-green-600 rounded-full animate-pulse delay-2000"></div>
      <div className="absolute bottom-1/3 right-8 w-3 h-3 bg-green-500 rounded-full animate-pulse delay-3000"></div>
    </div>
  );
}