'use client'

import React, { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'

interface SigninData {
  hasSignedToday: boolean
  streak: number
  longestStreak: number
  totalPoints: number
  todayReward: number
  nextReward: number
  streakBonus: number
}

interface SigninHistory {
  date: string
  points: number
  streak: number
  bonusPoints: number
  bonusReason: string
}

const ClientGameSigninPage: React.FC = () => {
  const [signinData, setSigninData] = useState<SigninData>({
    hasSignedToday: false,
    streak: 0,
    longestStreak: 0,
    totalPoints: 0,
    todayReward: 10,
    nextReward: 10,
    streakBonus: 0
  })
  const [signinHistory, setSigninHistory] = useState<SigninHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    fetchSigninData()
    fetchSigninHistory()
  }, [])

  const fetchSigninData = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/game/signin')
      const result = await response.json()
      
      if (result.success) {
        const data = result.data
        setSigninData({
          hasSignedToday: data.hasSignedToday,
          streak: data.streak,
          longestStreak: data.longestStreak,
          totalPoints: data.totalPoints,
          todayReward: 10, // 基础签到积分
          nextReward: data.streak === 6 ? 20 : 10, // 7天连续签到奖励
          streakBonus: 0
        })
        setSigninHistory(data.signinHistory || [])
      } else {
        console.error('获取签到数据失败:', result.message)
      }
      setLoading(false)
    } catch (error) {
      console.error('获取签到数据失败:', error)
      setLoading(false)
    }
  }

  const fetchSigninHistory = async () => {
    // 历史数据已经在 fetchSigninData 中一起获取了
    // 这里不需要单独获取
  }

  const handleSignin = async () => {
    if (signinData.hasSignedToday || signingIn) return

    try {
      setSigningIn(true)
      
      const response = await fetch('/api/game/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const result = await response.json()
      
      if (result.success) {
        const data = result.data
        
        setSigninData(prev => ({
          ...prev,
          hasSignedToday: true,
          streak: data.streak,
          longestStreak: Math.max(prev.longestStreak, data.streak),
          totalPoints: data.totalPoints
        }))

        // 添加到历史记录
        const newHistory: SigninHistory = {
          date: new Date().toISOString().split('T')[0],
          points: data.basePoints,
          streak: data.streak,
          bonusPoints: data.bonusPoints,
          bonusReason: data.bonusReason || ''
        }
        setSigninHistory(prev => [newHistory, ...prev])

        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      } else {
        alert(result.message || '签到失败')
      }
      setSigningIn(false)
    } catch (error) {
      console.error('签到失败:', error)
      alert('网络错误，请稍后重试')
      setSigningIn(false)
    }
  }

  const getStreakRewards = () => {
    const rewards = [
      { days: 1, points: 10, desc: '基础奖励' },
      { days: 7, points: 30, desc: '连续一周' },
      { days: 14, points: 60, desc: '连续两周' },
      { days: 30, points: 150, desc: '连续一月' },
      { days: 100, points: 500, desc: '连续百天' }
    ]
    return rewards
  }

  const getCalendarDays = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // 添加空白天数
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // 添加月份天数
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const hasSignedThisDay = signinHistory.some(h => h.date === dateStr)
      const isToday = day === today.getDate()
      
      days.push({
        day,
        dateStr,
        hasSignedThisDay,
        isToday
      })
    }
    
    return days
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 relative overflow-hidden">
      {/* 中国风装饰背景 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 border-4 border-red-600 rounded-full"></div>
        <div className="absolute top-20 right-20 w-24 h-24 border-2 border-red-500 rotate-45"></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 border-3 border-red-400 rounded-full"></div>
      </div>

      {/* 成功提示 */}
      {showSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl animate-bounce">
          🎉 签到成功！获得积分奖励
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h1 className="text-5xl font-black text-red-700 mb-4 relative">
              每日签到
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full opacity-80"></div>
            </h1>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
          </div>
          <p className="text-red-600 text-lg font-bold mt-6 max-w-2xl mx-auto">
            每日签到获得积分，连续签到获得额外奖励
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔄</div>
            <div className="text-red-600 font-bold">加载签到数据中...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 签到主区域 */}
            <div className="lg:col-span-2 space-y-8">
              {/* 签到卡片 */}
              <div className="bg-white rounded-2xl p-8 shadow-xl border-4 border-red-200">
                <div className="text-center">
                  <div className="text-6xl mb-4">📅</div>
                  <h2 className="text-3xl font-black text-red-700 mb-4">
                    {signinData.hasSignedToday ? '今日已签到' : '今日签到'}
                  </h2>
                  
                  {signinData.hasSignedToday ? (
                    <div className="space-y-4">
                      <div className="text-green-600 font-bold text-xl">✅ 签到完成</div>
                      <div className="text-red-600">明天再来签到吧！</div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-red-600 text-lg">
                        点击下方按钮完成今日签到
                      </div>
                      
                      {/* 今日奖励预览 */}
                      <div className="bg-red-50 rounded-xl p-4">
                        <div className="text-red-700 font-bold mb-2">今日奖励：</div>
                        <div className="flex justify-center items-center gap-4">
                          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-bold">
                            💎 {signinData.todayReward}积分
                          </span>
                          {signinData.streak === 6 && (
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold">
                              🎁 +{signinData.nextReward}积分 (7天奖励)
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={handleSignin}
                        disabled={signingIn}
                        className={`w-full py-4 rounded-xl font-bold text-xl transition-all duration-300 ${
                          signingIn
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        }`}
                      >
                        {signingIn ? '🔄 签到中...' : '🎯 立即签到'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 签到统计 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-4 text-white text-center">
                  <div className="text-2xl mb-2">🔥</div>
                  <div className="text-sm text-red-200">连续签到</div>
                  <div className="text-xl font-bold">{signinData.streak}天</div>
                </div>
                <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl p-4 text-white text-center">
                  <div className="text-2xl mb-2">🏆</div>
                  <div className="text-sm text-orange-200">最长记录</div>
                  <div className="text-xl font-bold">{signinData.longestStreak}天</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-4 text-white text-center">
                  <div className="text-2xl mb-2">💎</div>
                  <div className="text-sm text-yellow-200">总积分</div>
                  <div className="text-xl font-bold">{signinData.totalPoints.toLocaleString()}</div>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-sm text-red-200">签到次数</div>
                  <div className="text-xl font-bold">{signinHistory.length}</div>
                </div>
              </div>

              {/* 签到日历 */}
              <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-red-200">
                <h3 className="text-2xl font-black text-red-700 mb-6 text-center">签到日历</h3>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                    <div key={day} className="text-center font-bold text-red-600 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {getCalendarDays().map((dayData, index) => (
                    <div key={index} className="aspect-square">
                      {dayData ? (
                        <div className={`w-full h-full flex items-center justify-center rounded-lg text-sm font-bold ${
                          dayData.isToday
                            ? 'bg-red-600 text-white'
                            : dayData.hasSignedThisDay
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {dayData.day}
                          {dayData.hasSignedThisDay && !dayData.isToday && (
                            <div className="absolute text-xs">✓</div>
                          )}
                        </div>
                      ) : (
                        <div></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 侧边栏 */}
            <div className="space-y-8">
              {/* 连续签到奖励 */}
              <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-red-200">
                <h3 className="text-xl font-black text-red-700 mb-4 text-center">连续签到奖励</h3>
                <div className="space-y-3">
                  {getStreakRewards().map((reward, index) => (
                    <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                      signinData.streak >= reward.days
                        ? 'bg-green-100 border-2 border-green-300'
                        : signinData.streak === reward.days - 1
                        ? 'bg-yellow-100 border-2 border-yellow-300'
                        : 'bg-gray-100 border-2 border-gray-200'
                    }`}>
                      <div>
                        <div className="font-bold text-sm">
                          {signinData.streak >= reward.days ? '✅' : signinData.streak === reward.days - 1 ? '🎯' : '⭕'} 
                          {reward.desc}
                        </div>
                        <div className="text-xs text-gray-600">{reward.days}天</div>
                      </div>
                      <div className="font-bold text-red-600">
                        +{reward.points}积分
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 签到历史 */}
              <div className="bg-white rounded-2xl p-6 shadow-xl border-4 border-red-200">
                <h3 className="text-xl font-black text-red-700 mb-4 text-center">最近签到</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {signinHistory.slice(0, 10).map((history, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <div className="font-bold text-sm text-red-700">
                          {new Date(history.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-red-600">
                          连续{history.streak}天
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">
                          +{history.points + history.bonusPoints}积分
                        </div>
                        {history.bonusPoints > 0 && (
                          <div className="text-xs text-orange-600">
                            含奖励{history.bonusPoints}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 返回按钮 */}
        <div className="text-center mt-12">
          <Link href="/game">
            <button className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-colors shadow-lg">
              ← 返回游戏中心
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ClientGameSigninPage