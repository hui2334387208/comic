'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button, message, Spin, Modal, InputNumber } from 'antd'
import { SwapOutlined } from '@ant-design/icons'

interface CheckInStatus {
  hasCheckedInToday: boolean
  todayCheckIn: any
  consecutiveDays: number
  monthCheckInDays: number
  recentCheckIns: any[]
}

interface PointsBalance {
  balance: number
  totalEarned: number
  totalSpent: number
}

interface CreditsBalance {
  balance: number
  totalRecharged: number
  totalConsumed: number
}

interface CheckInRule {
  id: number
  name: string
  consecutiveDays: number
  points: number
  description: string
  status: string
  sortOrder: number
}

interface ExchangeRate {
  id: number
  name: string
  pointsRequired: number
  creditsReceived: number
  description: string
  status: string
  sortOrder: number
}

export default function CheckInPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(null)
  const [pointsBalance, setPointsBalance] = useState<PointsBalance | null>(null)
  const [creditsBalance, setCreditsBalance] = useState<CreditsBalance | null>(null)
  const [checkInRules, setCheckInRules] = useState<CheckInRule[]>([])
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([])
  const [selectedRate, setSelectedRate] = useState<ExchangeRate | null>(null)
  const [exchangeModalVisible, setExchangeModalVisible] = useState(false)
  const [exchangeAmount, setExchangeAmount] = useState(1)
  const [exchanging, setExchanging] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in')
    } else if (status === 'authenticated') {
      fetchData()
    }
  }, [status, router])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [checkInRes, pointsRes, creditsRes, rulesRes, ratesRes] = await Promise.all([
        fetch('/api/checkin'),
        fetch('/api/points/balance'),
        fetch('/api/credits/balance'),
        fetch('/api/checkin/rules'),
        fetch('/api/points/exchange-rates')
      ])

      const [checkInData, pointsData, creditsData, rulesData, ratesData] = await Promise.all([
        checkInRes.json(),
        pointsRes.json(),
        creditsRes.json(),
        rulesRes.json(),
        ratesRes.json()
      ])

      if (checkInData.success) setCheckInStatus(checkInData.data)
      if (pointsData.success) setPointsBalance(pointsData.data)
      if (creditsData.success) setCreditsBalance(creditsData.data)
      if (rulesData.success) setCheckInRules(rulesData.data)
      if (ratesData.success) {
        setExchangeRates(ratesData.data)
        // 默认选择第一个兑换比例
        if (ratesData.data.length > 0) {
          setSelectedRate(ratesData.data[0])
        }
      }
    } catch (error) {
      console.error('获取数据失败:', error)
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (checkInStatus?.hasCheckedInToday) {
      message.info('今天已经签到过了')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/checkin', { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        message.success(data.data.message)
        fetchData()
      } else {
        message.error(data.error || '签到失败')
      }
    } catch (error) {
      message.error('签到失败')
    } finally {
      setLoading(false)
    }
  }

  const handleExchange = async () => {
    if (!selectedRate) {
      message.error('请选择兑换比例')
      return
    }

    if (exchangeAmount <= 0) {
      message.error('兑换次数必须大于0')
      return
    }

    const pointsNeeded = exchangeAmount * selectedRate.pointsRequired
    if (pointsBalance && pointsBalance.balance < pointsNeeded) {
      message.error(`积分不足，需要${pointsNeeded}积分`)
      return
    }

    setExchanging(true)
    try {
      const res = await fetch('/api/points/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          credits: exchangeAmount * selectedRate.creditsReceived, 
          exchangeRate: selectedRate.pointsRequired 
        }),
      })
      const data = await res.json()

      if (data.success) {
        message.success(data.data.message)
        setExchangeModalVisible(false)
        setExchangeAmount(1)
        fetchData()
      } else {
        message.error(data.error || '兑换失败')
      }
    } catch (error) {
      message.error('兑换失败')
    } finally {
      setExchanging(false)
    }
  }

  // 生成日历数据
  const generateCalendar = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const calendar = []
    let week = []
    
    for (let i = 0; i < firstDay; i++) {
      week.push(null)
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const isCheckedIn = checkInStatus?.recentCheckIns?.some(item => item.checkInDate === dateStr)
      const isToday = day === today.getDate()
      
      week.push({ day, dateStr, isCheckedIn, isToday })
      
      if (week.length === 7) {
        calendar.push(week)
        week = []
      }
    }
    
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null)
      }
      calendar.push(week)
    }
    
    return calendar
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        <Spin size="large" />
      </div>
    )
  }

  const calendar = generateCalendar()
  const today = new Date()
  const monthName = today.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl shadow-xl mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
            <span className="text-3xl">📅</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              每日签到
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            点击今天的日期完成签到，领取积分奖励
          </p>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg border-2 border-purple-200/50 dark:border-purple-800/50">
            <div className="text-4xl mb-3">💎</div>
            <div className="text-3xl font-black text-purple-600 dark:text-purple-400">{pointsBalance?.balance || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">当前积分</div>
          </div>
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg border-2 border-orange-200/50 dark:border-orange-800/50">
            <div className="text-4xl mb-3">🔥</div>
            <div className="text-3xl font-black text-orange-600 dark:text-orange-400">{checkInStatus?.consecutiveDays || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">连续签到天数</div>
          </div>
        </div>

        {/* 签到日历 */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border-2 border-purple-200/50 dark:border-purple-800/50 mb-8">
          
          {/* 日历头部 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">{monthName}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                本月已签到 <strong className="text-purple-600 dark:text-purple-400">{checkInStatus?.monthCheckInDays || 0}</strong> 天
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-green-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">已签</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">今天</span>
              </div>
            </div>
          </div>

          {/* 日历 */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200/30 dark:border-purple-800/30">
            {/* 星期标题 */}
            <div className="grid grid-cols-7 gap-3 mb-4">
              {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                <div key={index} className="text-center text-sm font-bold text-gray-600 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* 日历格子 */}
            <div className="space-y-3">
              {calendar.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-3">
                  {week.map((day, dayIndex) => (
                    <button
                      key={dayIndex}
                      onClick={() => day?.isToday && handleCheckIn()}
                      disabled={!day?.isToday || checkInStatus?.hasCheckedInToday || loading}
                      className={`
                        aspect-square rounded-xl flex flex-col items-center justify-center text-lg font-bold transition-all duration-300 relative
                        ${!day ? 'bg-transparent cursor-default' : ''}
                        ${day?.isToday && !checkInStatus?.hasCheckedInToday ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-xl scale-110 ring-4 ring-purple-200 dark:ring-purple-800 cursor-pointer hover:scale-115 animate-pulse' : ''}
                        ${day?.isToday && checkInStatus?.hasCheckedInToday ? 'bg-gradient-to-br from-green-400 to-green-500 text-white shadow-lg scale-105' : ''}
                        ${day?.isCheckedIn && !day?.isToday ? 'bg-gradient-to-br from-green-400 to-green-500 text-white shadow-md' : ''}
                        ${day && !day?.isCheckedIn && !day?.isToday ? 'bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-default' : ''}
                      `}
                    >
                      {day && (
                        <>
                          <span className="text-xl">{day.day}</span>
                          {day.isCheckedIn && (
                            <span className="text-xs mt-1">✓</span>
                          )}
                          {day.isToday && !checkInStatus?.hasCheckedInToday && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></span>
                          )}
                        </>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {checkInStatus?.hasCheckedInToday && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl border-2 border-green-200 dark:border-green-800">
                <span className="text-xl">✓</span>
                <span className="font-bold">今日已签到</span>
              </div>
            </div>
          )}
        </div>

        {/* 签到奖励规则 */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border-2 border-purple-200/50 dark:border-purple-800/50 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center text-lg">
              🎁
            </span>
            签到奖励规则
          </h2>
          {checkInRules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checkInRules.map((rule, index) => {
                // 根据索引选择不同的颜色主题
                const isSpecial = index === checkInRules.length - 1 && checkInRules.length > 1
                const colorTheme = index % 2 === 0 
                  ? { bg: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20', border: 'border-purple-200/30 dark:border-purple-800/30', badge: 'bg-purple-600', text: 'text-purple-600 dark:text-purple-400' }
                  : { bg: 'from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20', border: 'border-pink-200/30 dark:border-pink-800/30', badge: 'bg-pink-600', text: 'text-pink-600 dark:text-pink-400' }
                
                return (
                  <div 
                    key={rule.id} 
                    className={`
                      ${isSpecial ? 'md:col-span-2' : ''} 
                      flex items-center justify-between p-4 bg-gradient-to-br ${colorTheme.bg} rounded-xl border ${isSpecial ? 'border-2 border-purple-300/50 dark:border-purple-700/50' : colorTheme.border}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-10 h-10 ${isSpecial ? 'bg-gradient-to-r from-purple-600 to-pink-600' : colorTheme.badge} text-white rounded-lg flex items-center justify-center font-bold`}>
                        {rule.consecutiveDays}
                      </span>
                      <div>
                        <span className={`${isSpecial ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                          {rule.name}
                        </span>
                        {rule.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{rule.description}</p>
                        )}
                      </div>
                    </div>
                    <span className={`${isSpecial ? 'text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent' : `text-xl font-black ${colorTheme.text}`}`}>
                      +{rule.points}积分
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              暂无签到规则
            </div>
          )}
        </div>

        {/* 积分兑换 */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border-2 border-pink-200/50 dark:border-pink-800/50">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-pink-600 text-white rounded-xl flex items-center justify-center text-lg">
              ⇄
            </span>
            积分兑换次数
          </h2>
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-pink-200/30 dark:border-pink-800/30 mb-6">
            <div className="text-center">
              <div className="text-lg text-gray-700 dark:text-gray-300 mb-4">兑换比例</div>
              {selectedRate ? (
                <>
                  <div className="flex items-center justify-center gap-4 text-3xl font-black mb-6">
                    <span className="text-purple-600 dark:text-purple-400">{selectedRate.pointsRequired}积分</span>
                    <span className="text-gray-400">=</span>
                    <span className="text-pink-600 dark:text-pink-400">{selectedRate.creditsReceived}次数</span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    当前积分可兑换：<strong className="text-pink-600 dark:text-pink-400 text-xl">{Math.floor((pointsBalance?.balance || 0) / selectedRate.pointsRequired) * selectedRate.creditsReceived}</strong> 次
                  </div>
                </>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">暂无兑换比例配置</div>
              )}
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            block
            icon={<SwapOutlined />}
            onClick={() => setExchangeModalVisible(true)}
            disabled={!selectedRate}
            className="!bg-gradient-to-r !from-pink-600 !to-purple-600 hover:!from-pink-700 hover:!to-purple-700 !border-none !rounded-xl !font-bold !h-14 !text-lg"
          >
            立即兑换
          </Button>
        </div>

      </div>

      {/* 兑换弹窗 */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg flex items-center justify-center">
              ⇄
            </span>
            <span className="text-xl font-bold">积分兑换次数</span>
          </div>
        }
        open={exchangeModalVisible}
        onOk={handleExchange}
        onCancel={() => setExchangeModalVisible(false)}
        confirmLoading={exchanging}
        okText="确认兑换"
        cancelText="取消"
        okButtonProps={{
          className: '!bg-gradient-to-r !from-pink-600 !to-purple-600 hover:!from-pink-700 hover:!to-purple-700 !border-none !rounded-lg !font-bold'
        }}
      >
        <div className="py-6 space-y-6">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200/30 dark:border-purple-800/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 dark:text-gray-400">当前积分</span>
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{pointsBalance?.balance || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">兑换比例</span>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                {selectedRate ? `${selectedRate.pointsRequired}积分 = ${selectedRate.creditsReceived}次数` : '暂无配置'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">兑换次数</label>
            <InputNumber
              min={1}
              max={selectedRate ? Math.floor((pointsBalance?.balance || 0) / selectedRate.pointsRequired) * selectedRate.creditsReceived : 0}
              value={exchangeAmount}
              onChange={(value) => setExchangeAmount(value || 1)}
              className="!w-full !h-12 !text-lg !rounded-xl"
              size="large"
              disabled={!selectedRate}
            />
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-pink-200/30 dark:border-pink-800/30 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">需要消费</span>
              <span className="text-xl font-black text-purple-600 dark:text-purple-400">
                {selectedRate ? Math.ceil(exchangeAmount / selectedRate.creditsReceived) * selectedRate.pointsRequired : 0} 积分
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">将获得</span>
              <span className="text-xl font-black text-pink-600 dark:text-pink-400">{exchangeAmount} 次数</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
