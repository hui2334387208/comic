'use client';

import React from 'react';
import { Progress, Tag, Button } from 'antd';
import { PlayCircleOutlined, BookOutlined, ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    level: string;
    category: string;
    coverImage?: string;
    duration: number;
    progress: number;
    lessonCount: number;
    learningObjectives: string[];
  };
  locale: string;
}

const levelColors = {
  beginner: '#52c41a',
  intermediate: '#faad14',
  advanced: '#f5222d',
  expert: '#722ed1'
};

const levelLabels = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
  expert: '专家'
};

const categoryLabels = {
  basic: '基础知识',
  rhythm: '韵律格律',
  theme: '主题创作',
  advanced: '高级技巧'
};

export default function CourseCard({ course, locale }: CourseCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <div className="group relative bg-gradient-to-br from-white/95 to-red-50/80 dark:from-gray-800/95 dark:to-red-900/30 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 p-6 border-2 border-red-100/50 dark:border-red-800/50 hover:border-red-300 dark:hover:border-red-600 overflow-hidden h-full">
        {/* 传统装饰背景 */}
        <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
          <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="3"/>
            <path d="M35 50 Q50 35, 65 50 Q50 65, 35 50" fill="currentColor"/>
          </svg>
        </div>
        
        {/* 课程封面区域 */}
        <div className="relative h-48 mb-6 overflow-hidden rounded-2xl">
          {course.coverImage ? (
            <img
              alt={course.title}
              src={course.coverImage}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 flex items-center justify-center">
              <BookOutlined className="text-6xl text-red-400 dark:text-red-500" />
            </div>
          )}
          
          {/* 进度覆盖层 */}
          {course.progress > 0 && (
            <div className="absolute top-4 right-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                <div className="relative w-10 h-10">
                  <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-200"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-red-500"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${course.progress}, 100`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-red-600">
                      {course.progress}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 级别标签 */}
          <div className="absolute top-4 left-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/40 dark:to-orange-900/40 text-red-700 dark:text-red-300 text-xs font-bold border border-red-200 dark:border-red-800 shadow-md">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
              {levelLabels[course.level as keyof typeof levelLabels]}
            </div>
          </div>
        </div>

        {/* 分类标签和印章 */}
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/40 dark:to-yellow-900/40 text-orange-700 dark:text-orange-300 text-xs font-bold border border-orange-200 dark:border-orange-800">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse" />
            {categoryLabels[course.category as keyof typeof categoryLabels]}
          </div>
          <div className="relative w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl flex items-center justify-center text-sm font-black shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
            <span>学</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
          </div>
        </div>

        {/* 标题 */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300 tracking-wide line-clamp-2">
          {course.title}
        </h3>

        {/* 描述 */}
        <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 leading-relaxed">
          {course.description}
        </p>
        
        {/* 课程信息 */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <BookOutlined className="mr-1" />
              {course.lessonCount} 章节
            </span>
            <span className="flex items-center">
              <ClockCircleOutlined className="mr-1" />
              {Math.floor(course.duration / 60)}h {course.duration % 60}m
            </span>
          </div>
          
          {course.progress > 0 && (
            <div className="flex items-center text-red-500">
              <TrophyOutlined className="mr-1" />
              <span className="font-medium">{course.progress}%</span>
            </div>
          )}
        </div>

        {/* 学习目标预览 */}
        {course.learningObjectives && course.learningObjectives.length > 0 && (
          <div className="mb-6">
            <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">学习目标:</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              • {course.learningObjectives[0]}
              {course.learningObjectives.length > 1 && (
                <span className="text-gray-400 dark:text-gray-500 ml-1">
                  等{course.learningObjectives.length}项
                </span>
              )}
            </div>
          </div>
        )}

        {/* 进度条 */}
        {course.progress > 0 && (
          <div className="mb-6">
            <Progress
              percent={course.progress}
              strokeColor={{
                '0%': '#ff7875',
                '100%': '#f5222d',
              }}
              trailColor="#ffebee"
              className="course-progress"
            />
          </div>
        )}

        {/* 操作按钮 */}
        <div className="mt-auto">
          <Link href={`/${locale}/education/courses/${course.id}`}>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-2xl h-12 text-base font-bold"
              size="large"
            >
              {course.progress > 0 ? '继续学习' : '开始学习'}
            </Button>
          </Link>
        </div>

        {/* 悬停光效 - 与首页保持一致 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-100/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />
      </div>

      <style jsx>{`
        .course-progress :global(.ant-progress-bg) {
          border-radius: 4px;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </motion.div>
  );
}