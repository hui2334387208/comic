'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  const [stats, setStats] = useState({
    todayViews: 0,
    todayLikes: 0,
    todayFavorites: 0,
    growthRate: 0,
    totalViews: 0,
    totalLikes: 0,
    totalFavorites: 0,
    totalComments: 0,
  })
  const [topWorks, setTopWorks] = useState([])
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/creator/analytics?range=${timeRange}`)
      const result = await response.json()
      if (result.success) {
        setStats(result.data.stats)
        setTopWorks(result.data.topWorks)
        setChartData(result.data.chartData)
      }
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          数据分析
        </h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-6 py-3 border-2 border-indigo-200 rounded-xl focus:border-indigo-600 focus:outline-none font-bold"
        >
          <option value="7d">最近7天</option>
          <option value="30d">最近30天</option>
          <option value="90d">最近90天</option>
        </select>
      </div>

      {/* 今日数据 */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { icon: '👁️', label: '今日浏览', value: stats.todayViews, color: 'blue' },
          { icon: '❤️', label: '今日点赞', value: stats.todayLikes, color: 'red' },
          { icon: '⭐', label: '今日收藏', value: stats.todayFavorites, color: 'yellow' },
          { icon: '📈', label: '增长率', value: `${stats.growthRate > 0 ? '+' : ''}${stats.growthRate}%`, color: 'green' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl p-8 shadow-xl border-4 border-indigo-200/50">
            <span className="text-5xl mb-4 block">{stat.icon}</span>
            <p className="text-gray-500 text-sm font-bold mb-2">{stat.label}</p>
            <p className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* 累计数据 */}
      <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-indigo-200/50 mb-8">
        <h2 className="text-2xl font-black text-gray-800 mb-6">累计数据</h2>
        <div className="grid grid-cols-4 gap-6">
          {[
            { icon: '👁️', label: '总浏览量', value: stats.totalViews },
            { icon: '❤️', label: '总点赞数', value: stats.totalLikes },
            { icon: '⭐', label: '总收藏数', value: stats.totalFavorites },
            { icon: '💬', label: '总评论数', value: stats.totalComments },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl mb-2">{stat.icon}</div>
              <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-gray-800">{stat.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 趋势图 */}
      <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-indigo-200/50 mb-8">
        <h2 className="text-2xl font-black text-gray-800 mb-6">浏览趋势</h2>
        {chartData.length > 0 ? (
          <div className="h-64 flex items-end justify-between gap-2">
            {chartData.map((item: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${(item.value / Math.max(...chartData.map((d: any) => d.value))) * 100}%` }}
                />
                <p className="text-xs text-gray-500 mt-2">{item.date}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-500">暂无数据</p>
          </div>
        )}
      </div>

      {/* 热门作品排行 */}
      <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-indigo-200/50">
        <h2 className="text-2xl font-black text-gray-800 mb-6">热门作品排行</h2>
        {topWorks.length > 0 ? (
          <div className="space-y-4">
            {topWorks.map((work: any, i: number) => (
              <div
                key={work.id}
                onClick={() => router.push(`/creator/works/${work.id}`)}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-indigo-50 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xl">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{work.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span>👁️ {work.viewCount}</span>
                    <span>❤️ {work.likeCount}</span>
                    <span>⭐ {work.favoriteCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-500">暂无数据</p>
          </div>
        )}
      </div>
    </div>
  )
}
