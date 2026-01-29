'use client'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'
import React, { useState } from 'react'

export interface CoupletEvent {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
  mediaUrls?: string[];
  tags?: string[];
}

export interface CoupletVisualizerProps {
  events: CoupletEvent[];
  mode: 'vertical' | 'horizontal' | 'alternating';
  onEventClick?: (event: CoupletEvent) => void;
  className?: string;
}

const CoupletVisualizer: React.FC<CoupletVisualizerProps> = ({
  events,
  mode = 'vertical',
  onEventClick,
  className = '',
}) => {
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null)

  const handleEventClick = (event: CoupletEvent) => {
    setSelectedEvent(event.id)
    onEventClick?.(event)
  }

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY-MM-DD')
  }

  const renderVerticalTimeline = () => (
    <div className="relative">
      {/* 时间线轴线 */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500" />

      {events.map((event, index) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative flex items-start mb-8"
        >
          {/* 时间点 */}
          <div className="absolute left-6 w-4 h-4 bg-white border-4 border-blue-500 rounded-full shadow-lg z-10" />

          {/* 事件卡片 */}
          <div className="ml-16 flex-1">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleEventClick(event)}
              className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-300 ${
                selectedEvent === event.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* 日期 */}
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                {formatDate(event.startDate)}
                {event.endDate && ` - ${formatDate(event.endDate)}`}
              </div>

              {/* 标题 */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {event.title}
              </h3>

              {/* 描述 */}
              <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                {event.description}
              </p>

              {/* 位置 */}
              {event.location && (
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {event.location}
                </div>
              )}

              {/* 标签 */}
              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  )

  const renderHorizontalTimeline = () => (
    <div className="relative overflow-x-auto">
      <div className="flex space-x-8 min-w-max p-8">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 w-80"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleEventClick(event)}
              className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-300 ${
                selectedEvent === event.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* 日期 */}
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                {formatDate(event.startDate)}
              </div>

              {/* 标题 */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                {event.title}
              </h3>

              {/* 描述 */}
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                {event.description}
              </p>

              {/* 位置 */}
              {event.location && (
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {event.location}
                </div>
              )}

              {/* 标签 */}
              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {event.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  )

  const renderAlternatingTimeline = () => (
    <div className="relative">
      {/* 时间线轴线 */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 transform -translate-x-1/2" />

      {events.map((event, index) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`relative flex items-center mb-8 ${
            index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
          }`}
        >
          {/* 时间点 */}
          <div className="absolute left-1/2 w-4 h-4 bg-white border-4 border-blue-500 rounded-full shadow-lg z-10 transform -translate-x-1/2" />

          {/* 事件卡片 */}
          <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8' : 'pl-8'}`}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleEventClick(event)}
              className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-300 ${
                selectedEvent === event.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* 日期 */}
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                {formatDate(event.startDate)}
              </div>

              {/* 标题 */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                {event.title}
              </h3>

              {/* 描述 */}
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                {event.description}
              </p>

              {/* 位置 */}
              {event.location && (
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {event.location}
                </div>
              )}

              {/* 标签 */}
              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {event.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  )

  const renderTimeline = () => {
    switch (mode) {
      case 'horizontal':
        return renderHorizontalTimeline()
      case 'alternating':
        return renderAlternatingTimeline()
      default:
        return renderVerticalTimeline()
    }
  }

  return (
    <div className={`timeline-visualizer ${className}`}>
      {renderTimeline()}
    </div>
  )
}

export default CoupletVisualizer
