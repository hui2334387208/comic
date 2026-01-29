'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Link } from '@/i18n/navigation';

interface Exercise {
  id: string;
  type: string;
  title: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  hints: string[];
  difficulty: string;
  points: number;
  timeLimit?: number;
  tags: string[];
}

interface DailyPracticeData {
  date: string;
  exercises: Exercise[];
  completedCount: number;
  totalScore: number;
  streak: number;
  isCompleted: boolean;
}

interface ClientDailyPracticePageProps {
  locale: string;
}

export default function ClientDailyPracticePage({ locale }: ClientDailyPracticePageProps) {
  const { data: session } = useSession();
  const [practiceData, setPracticeData] = useState<DailyPracticeData | null>(null);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    fetchDailyPractice();
  }, []);

  useEffect(() => {
    if (practiceData && practiceData.exercises.length > 0) {
      setCurrentExercise(practiceData.exercises[currentIndex]);
      setUserAnswer('');
      setShowAnswer(false);
      setShowHints(false);
      
      // 设置计时器
      const exercise = practiceData.exercises[currentIndex];
      if (exercise.timeLimit) {
        setTimeLeft(exercise.timeLimit);
      }
    }
  }, [practiceData, currentIndex]);

  useEffect(() => {
    if (timeLeft && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setShowAnswer(true);
    }
  }, [timeLeft]);

  const fetchDailyPractice = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/education/exercises/daily');
      const data = await response.json();
      
      if (data.success) {
        setPracticeData(data.data);
      }
    } catch (error) {
      console.error('获取每日练习失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'fill_blank': return '填空题';
      case 'error_correction': return '改错题';
      case 'creation': return '创作题';
      case 'matching': return '配对题';
      case 'choice': return '选择题';
      default: return type;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return difficulty;
    }
  };

  const handleSubmit = () => {
    setShowAnswer(true);
    // TODO: 提交答案到后端
  };

  const handleNext = () => {
    if (currentIndex < (practiceData?.exercises.length || 0) - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">✏️</div>
          <div className="text-red-600 font-bold text-xl">加载每日练习中...</div>
        </div>
      </div>
    );
  }

  if (!practiceData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-red-600 font-bold text-xl mb-4">获取练习数据失败</div>
          <button 
            onClick={fetchDailyPractice}
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

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <h1 className="text-5xl font-black text-red-700 mb-4 relative">
              每日一练
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full opacity-80"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-orange-600 rounded-full opacity-60"></div>
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
          </div>
          <p className="text-red-600 text-lg font-bold mt-6">
            {new Date().toLocaleDateString('zh-CN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
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

        {/* 练习统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">🔥</div>
            <div className="text-sm text-red-200">连续天数</div>
            <div className="text-xl font-bold">{practiceData.streak}天</div>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-sm text-orange-200">完成题数</div>
            <div className="text-xl font-bold">{practiceData.completedCount}/{practiceData.exercises.length}</div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">⭐</div>
            <div className="text-sm text-red-200">今日得分</div>
            <div className="text-xl font-bold">{practiceData.totalScore}</div>
          </div>
          <div className="bg-gradient-to-br from-red-700 to-red-800 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">{practiceData.isCompleted ? '🎉' : '⏳'}</div>
            <div className="text-sm text-red-200">状态</div>
            <div className="text-lg font-bold">{practiceData.isCompleted ? '已完成' : '进行中'}</div>
          </div>
        </div>

        {/* 练习题区域 */}
        {currentExercise && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border-4 border-red-200 mb-8">
            {/* 题目头部 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getDifficultyColor(currentExercise.difficulty)}`}>
                  {getDifficultyText(currentExercise.difficulty)}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                  {getTypeText(currentExercise.type)}
                </span>
                <span className="text-gray-600 text-sm">
                  第 {currentIndex + 1} / {practiceData.exercises.length} 题
                </span>
              </div>
              <div className="flex items-center gap-4">
                {timeLeft !== null && (
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    timeLeft > 30 ? 'bg-green-100 text-green-600' : 
                    timeLeft > 10 ? 'bg-yellow-100 text-yellow-600' : 
                    'bg-red-100 text-red-600'
                  }`}>
                    ⏰ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </div>
                )}
                <div className="text-red-600 font-bold">
                  💎 {currentExercise.points} 分
                </div>
              </div>
            </div>

            {/* 题目标题 */}
            <h3 className="text-2xl font-black text-red-700 mb-4">
              {currentExercise.title}
            </h3>

            {/* 题目内容 */}
            <div className="bg-red-50 rounded-xl p-6 mb-6">
              <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                {currentExercise.question}
              </div>
            </div>

            {/* 选择题选项 */}
            {currentExercise.type === 'choice' && currentExercise.options && (
              <div className="space-y-3 mb-6">
                {currentExercise.options.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      userAnswer === option
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={userAnswer === option}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      className="text-red-600"
                      disabled={showAnswer}
                    />
                    <span className="text-gray-800">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {/* 文本输入 */}
            {currentExercise.type !== 'choice' && (
              <div className="mb-6">
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="请输入您的答案..."
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none resize-none"
                  rows={4}
                  disabled={showAnswer}
                />
              </div>
            )}

            {/* 提示按钮 */}
            {!showAnswer && currentExercise.hints.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold transition-colors"
                >
                  💡 {showHints ? '隐藏提示' : '显示提示'}
                </button>
                {showHints && (
                  <div className="mt-4 bg-yellow-50 rounded-xl p-4">
                    <div className="text-yellow-800 font-bold mb-2">💡 提示：</div>
                    <ul className="space-y-2">
                      {currentExercise.hints.map((hint, index) => (
                        <li key={index} className="text-yellow-700 flex items-start gap-2">
                          <span className="text-yellow-500 mt-1">•</span>
                          <span>{hint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 答案区域 */}
            {showAnswer && (
              <div className="bg-green-50 rounded-xl p-6 mb-6">
                <div className="text-green-800 font-bold mb-3">✅ 正确答案：</div>
                <div className="text-green-700 mb-4 whitespace-pre-line">
                  {currentExercise.correctAnswer}
                </div>
                <div className="text-green-800 font-bold mb-2">📝 解析：</div>
                <div className="text-green-700 leading-relaxed">
                  {currentExercise.explanation}
                </div>
              </div>
            )}

            {/* 标签 */}
            {currentExercise.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {currentExercise.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-lg font-bold transition-colors"
              >
                ← 上一题
              </button>

              <div className="flex gap-4">
                {!showAnswer && (
                  <button
                    onClick={handleSubmit}
                    disabled={!userAnswer.trim()}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg font-bold transition-colors"
                  >
                    提交答案
                  </button>
                )}
                
                {showAnswer && currentIndex < practiceData.exercises.length - 1 && (
                  <button
                    onClick={handleNext}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
                  >
                    下一题 →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 完成状态 */}
        {practiceData.isCompleted && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-white text-center shadow-xl">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-3xl font-black mb-4">今日练习已完成！</h3>
            <p className="text-green-100 text-lg mb-6">
              恭喜您完成了今天的所有练习题，继续保持学习的好习惯！
            </p>
            <div className="flex justify-center gap-4">
              <div className="bg-green-400 rounded-xl p-4">
                <div className="text-sm text-green-100">总得分</div>
                <div className="text-2xl font-bold">{practiceData.totalScore}</div>
              </div>
              <div className="bg-green-400 rounded-xl p-4">
                <div className="text-sm text-green-100">连续天数</div>
                <div className="text-2xl font-bold">{practiceData.streak}天</div>
              </div>
            </div>
          </div>
        )}

        {/* 底部装饰 */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-6 bg-red-600 text-white px-8 py-4 rounded-full shadow-xl">
            <span className="text-2xl">✏️</span>
            <span className="font-bold text-lg">每日一练，持之以恒</span>
            <span className="text-2xl">✏️</span>
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