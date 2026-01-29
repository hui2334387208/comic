'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Radio, Input, Progress, message, Statistic, Tag, Modal, Space } from 'antd';
import { 
  FireOutlined, 
  TrophyOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  BulbOutlined,
  StarOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';

interface Exercise {
  id: string;
  type: string;
  title: string;
  question: string;
  options?: string[];
  hints: string[];
  difficulty: string;
  points: number;
  timeLimit?: number;
  completed: boolean;
  score: number;
}

interface PracticeRecord {
  id: string;
  completedCount: number;
  totalScore: number;
  isCompleted: boolean;
  exerciseIds: string[];
}

interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
}

interface DailyPracticeProps {
  locale: string;
}

const difficultyColors = {
  easy: '#52c41a',
  medium: '#faad14',
  hard: '#f5222d'
};

const difficultyLabels = {
  easy: '简单',
  medium: '中等',
  hard: '困难'
};

const typeLabels = {
  fill_blank: '填空题',
  error_correction: '改错题',
  creation: '创作题',
  matching: '匹配题',
  choice: '选择题'
};

export default function DailyPractice({ locale }: DailyPracticeProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [practiceRecord, setPracticeRecord] = useState<PracticeRecord | null>(null);
  const [stats, setStats] = useState<Stats>({ currentStreak: 0, longestStreak: 0, totalCompleted: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    fetchDailyPractice();
  }, []);

  useEffect(() => {
    // 计时器逻辑
    if (timeLeft !== null && timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleSubmit();
    }
  }, [timeLeft, showResult]);

  const fetchDailyPractice = async () => {
    try {
      const response = await fetch('/api/education/exercises/daily');
      const data = await response.json();
      
      if (data.success) {
        setExercises(data.data.exercises);
        setPracticeRecord(data.data.practiceRecord);
        setStats(data.data.stats);
        
        // 找到第一个未完成的题目
        const firstIncomplete = data.data.exercises.findIndex((ex: Exercise) => !ex.completed);
        if (firstIncomplete !== -1) {
          setCurrentIndex(firstIncomplete);
          if (data.data.exercises[firstIncomplete].timeLimit) {
            setTimeLeft(data.data.exercises[firstIncomplete].timeLimit);
          }
        }
      } else {
        message.error(data.message);
      }
    } catch (error) {
      message.error('获取每日练习失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!userAnswer.trim() && currentExercise.type !== 'choice') {
      message.warning('请输入答案');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/education/exercises/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: currentExercise.id,
          answer: userAnswer,
          timeSpent: currentExercise.timeLimit ? currentExercise.timeLimit - (timeLeft || 0) : 0
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setLastResult(data.data);
        setShowResult(true);
        
        // 更新练习状态
        const updatedExercises = [...exercises];
        updatedExercises[currentIndex] = {
          ...updatedExercises[currentIndex],
          completed: true,
          score: data.data.score
        };
        setExercises(updatedExercises);
        
        // 更新练习记录
        if (practiceRecord) {
          setPracticeRecord({
            ...practiceRecord,
            completedCount: practiceRecord.completedCount + 1,
            totalScore: practiceRecord.totalScore + data.data.score
          });
        }
        
        message.success(data.message);
      } else {
        message.error(data.message);
      }
    } catch (error) {
      message.error('提交答案失败');
    } finally {
      setSubmitting(false);
    }
  };

  const nextExercise = () => {
    setShowResult(false);
    setUserAnswer('');
    setShowHint(false);
    setHintIndex(0);
    
    const nextIndex = currentIndex + 1;
    if (nextIndex < exercises.length) {
      setCurrentIndex(nextIndex);
      if (exercises[nextIndex].timeLimit) {
        setTimeLeft(exercises[nextIndex].timeLimit);
      } else {
        setTimeLeft(null);
      }
    }
  };

  const showNextHint = () => {
    if (hintIndex < currentExercise.hints.length - 1) {
      setHintIndex(hintIndex + 1);
    }
    setShowHint(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-500">加载每日练习中...</p>
        </div>
      </div>
    );
  }

  if (!exercises.length) {
    return (
      <Card className="text-center">
        <div className="py-8">
          <TrophyOutlined className="text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl text-gray-500 mb-2">暂无练习题</h3>
          <p className="text-gray-400">请稍后再试</p>
        </div>
      </Card>
    );
  }

  const currentExercise = exercises[currentIndex];
  const completedCount = exercises.filter(ex => ex.completed).length;
  const totalScore = exercises.reduce((sum, ex) => sum + ex.score, 0);
  const isAllCompleted = completedCount === exercises.length;

  return (
    <div className="space-y-6">
      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <Statistic
            title="连续天数"
            value={stats.currentStreak}
            prefix={<FireOutlined className="text-red-500" />}
            valueStyle={{ color: '#f5222d', fontWeight: 'bold' }}
          />
        </Card>
        
        <Card className="text-center bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <Statistic
            title="最长记录"
            value={stats.longestStreak}
            prefix={<TrophyOutlined className="text-orange-500" />}
            valueStyle={{ color: '#fa8c16', fontWeight: 'bold' }}
          />
        </Card>
        
        <Card className="text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <Statistic
            title="今日完成"
            value={completedCount}
            suffix={`/ ${exercises.length}`}
            prefix={<CheckCircleOutlined className="text-green-500" />}
            valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
          />
        </Card>
        
        <Card className="text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <Statistic
            title="今日得分"
            value={totalScore}
            prefix={<StarOutlined className="text-purple-500" />}
            valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
          />
        </Card>
      </div>

      {/* 进度条 */}
      <Card>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">今日练习进度</span>
            <span className="text-sm text-gray-500">
              {completedCount} / {exercises.length}
            </span>
          </div>
          <Progress
            percent={(completedCount / exercises.length) * 100}
            strokeColor={{
              '0%': '#ff7875',
              '100%': '#f5222d',
            }}
            trailColor="#ffebee"
          />
        </div>
      </Card>

      {/* 练习题 */}
      {!isAllCompleted && (
        <Card
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold">
                  第 {currentIndex + 1} 题
                </span>
                <Tag color={difficultyColors[currentExercise.difficulty as keyof typeof difficultyColors]}>
                  {difficultyLabels[currentExercise.difficulty as keyof typeof difficultyLabels]}
                </Tag>
                <Tag color="blue">
                  {typeLabels[currentExercise.type as keyof typeof typeLabels]}
                </Tag>
                <Tag color="gold">
                  {currentExercise.points} 分
                </Tag>
              </div>
              
              {timeLeft !== null && (
                <div className="flex items-center space-x-2 text-red-500">
                  <ClockCircleOutlined />
                  <span className="font-mono text-lg">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>
          }
          className="shadow-lg"
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                {currentExercise.title}
              </h3>
              <div 
                className="text-gray-700 leading-relaxed text-lg bg-gray-50 p-4 rounded-lg"
                dangerouslySetInnerHTML={{ __html: currentExercise.question }}
              />
            </div>

            {!showResult && (
              <div className="space-y-4">
                {currentExercise.type === 'choice' && currentExercise.options ? (
                  <Radio.Group
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-full"
                  >
                    <div className="space-y-3">
                      {currentExercise.options.map((option, index) => (
                        <Radio
                          key={index}
                          value={option}
                          className="w-full p-3 border rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <span className="text-base">{option}</span>
                        </Radio>
                      ))}
                    </div>
                  </Radio.Group>
                ) : (
                  <Input.TextArea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="请输入您的答案..."
                    rows={4}
                    className="text-lg"
                  />
                )}

                <div className="flex justify-between items-center">
                  <div className="space-x-2">
                    {currentExercise.hints.length > 0 && (
                      <Button
                        icon={<BulbOutlined />}
                        onClick={showNextHint}
                        disabled={hintIndex >= currentExercise.hints.length - 1 && showHint}
                      >
                        {showHint ? '下一个提示' : '获取提示'}
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleSubmit}
                    loading={submitting}
                    className="bg-gradient-to-r from-red-500 to-red-600 border-0 px-8"
                  >
                    提交答案
                  </Button>
                </div>

                {/* 提示信息 */}
                <AnimatePresence>
                  {showHint && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                    >
                      <div className="flex items-start space-x-2">
                        <BulbOutlined className="text-yellow-500 mt-1" />
                        <div>
                          <div className="font-medium text-yellow-800 mb-1">
                            提示 {hintIndex + 1}:
                          </div>
                          <div className="text-yellow-700">
                            {currentExercise.hints[hintIndex]}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 答题结果 */}
            <AnimatePresence>
              {showResult && lastResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className={`p-6 rounded-lg ${
                    lastResult.isCorrect 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center space-x-3 mb-4">
                      {lastResult.isCorrect ? (
                        <CheckCircleOutlined className="text-2xl text-green-500" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                          <span className="text-white font-bold">×</span>
                        </div>
                      )}
                      <div>
                        <div className={`text-xl font-bold ${
                          lastResult.isCorrect ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {lastResult.isCorrect ? '回答正确！' : '回答错误'}
                        </div>
                        <div className="text-gray-600">
                          获得 {lastResult.score} 分
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-700">正确答案: </span>
                        <span className="text-green-600 font-medium">
                          {lastResult.correctAnswer}
                        </span>
                      </div>
                      
                      {lastResult.explanation && (
                        <div>
                          <span className="font-medium text-gray-700">解析: </span>
                          <div className="text-gray-600 mt-1">
                            {lastResult.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    {currentIndex < exercises.length - 1 ? (
                      <Button
                        type="primary"
                        size="large"
                        onClick={nextExercise}
                        className="bg-gradient-to-r from-red-500 to-red-600 border-0 px-8"
                      >
                        下一题
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-xl font-bold text-green-600">
                          🎉 今日练习完成！
                        </div>
                        <Button
                          type="primary"
                          size="large"
                          onClick={() => window.location.reload()}
                          className="bg-gradient-to-r from-green-500 to-green-600 border-0 px-8"
                        >
                          查看统计
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      )}

      {/* 完成状态 */}
      {isAllCompleted && (
        <Card className="text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <TrophyOutlined className="text-6xl text-green-500 mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              🎉 恭喜完成今日练习！
            </h2>
            <div className="text-lg text-gray-600 mb-4">
              总得分: <span className="font-bold text-green-600">{totalScore}</span> 分
            </div>
            <div className="text-gray-500">
              明天继续加油，保持学习连续性！
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}