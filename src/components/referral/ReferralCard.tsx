'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { message } from 'antd'

interface ReferralStats {
  referralCode: string | null
  totalInvites: number
  successfulInvites: number
  totalRewards: number
  invitees: Array<{
    id: number
    inviteeId: string
    status: string
    inviterRewarded: boolean
    inviteeRewarded: boolean
    inviterRewardAmount: number
    createdAt: string
    completedAt: string | null
  }>
  campaign: {
    inviterReward: number
    inviteeReward: number
    requirementType: string
  }
}

export default function ReferralCard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchStats()
    }
  }, [session])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/referral/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      } else {
        message.error(data.error || '获取邀请统计失败')
      }
    } catch (error) {
      message.error('获取邀请统计失败')
    } finally {
      setLoading(false)
    }
  }

  const copyReferralCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode)
      setCopiedCode(true)
      message.success('邀请码已复制到剪贴板')
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const copyReferralLink = () => {
    if (stats?.referralCode) {
      const link = `${window.location.origin}/sign-up?ref=${stats.referralCode}`
      navigator.clipboard.writeText(link)
      setCopiedLink(true)
      message.success('邀请链接已复制到剪贴板')
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const getRequirementText = (type: string) => {
    const map: Record<string, string> = {
      register: '注册即可',
      first_comic: '首次创作漫画',
      verified_email: '验证邮箱',
    }
    return map[type] || type
  }

  if (!session?.user) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl p-12 text-center border-2 border-purple-200/50 dark:border-purple-800/50">
        <div className="text-6xl mb-4">🔐</div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">请先登录</h3>
        <p className="text-gray-600 dark:text-gray-400">登录后即可查看邀请信息</p>
      </div>
    )
  }

  if (loading && !stats) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl p-12 text-center border-2 border-purple-200/50 dark:border-purple-800/50">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">加载中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 邀请奖励说明卡片 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-2xl p-8 border-4 border-white/20">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-white">
            <rect x="10" y="10" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="3"/>
            <circle cx="50" cy="50" r="20" fill="currentColor"/>
          </svg>
        </div>
        
        <div className="relative text-center text-white">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6 shadow-xl">
            <span className="text-4xl">🎁</span>
          </div>
          
          <h2 className="text-3xl font-black mb-3">邀请好友，双方获得奖励</h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            邀请好友注册并完成任务，你和好友都能获得免费创作次数
          </p>
          
          <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/30">
              <div className="text-5xl font-black mb-2">{stats?.campaign.inviterReward || 10}</div>
              <div className="text-sm font-bold opacity-90">邀请人奖励</div>
              <div className="text-xs opacity-75 mt-1">次</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/30">
              <div className="text-5xl font-black mb-2">{stats?.campaign.inviteeReward || 5}</div>
              <div className="text-sm font-bold opacity-90">新用户奖励</div>
              <div className="text-xs opacity-75 mt-1">次</div>
            </div>
          </div>
          
          <div className="mt-6 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
            <span>✨</span>
            <span>完成条件：{getRequirementText(stats?.campaign.requirementType || 'register')}</span>
          </div>
        </div>
      </div>


      {/* 我的邀请码卡片 */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 border-2 border-purple-200/50 dark:border-purple-800/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">📤</span>
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">我的邀请码</h3>
        </div>

        <div className="text-center mb-8">
          <div className="inline-block relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-30"></div>
            <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 px-12 py-8 rounded-2xl border-4 border-purple-300 dark:border-purple-700">
              <div className="text-5xl font-black tracking-widest text-purple-700 dark:text-purple-300 mb-2">
                {stats?.referralCode || '加载中...'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">你的专属邀请码</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={copyReferralCode}
            className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl px-6 py-4 font-bold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <div className="relative flex items-center justify-center gap-2">
              <span className="text-xl">{copiedCode ? '✓' : '📋'}</span>
              <span>{copiedCode ? '已复制' : '复制邀请码'}</span>
            </div>
          </button>
          
          <button
            onClick={copyReferralLink}
            className="group relative overflow-hidden bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 rounded-2xl px-6 py-4 font-bold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-purple-200 dark:border-purple-800"
          >
            <div className="absolute inset-0 bg-purple-50 dark:bg-purple-900/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <div className="relative flex items-center justify-center gap-2">
              <span className="text-xl">{copiedLink ? '✓' : '🔗'}</span>
              <span>{copiedLink ? '已复制' : '复制邀请链接'}</span>
            </div>
          </button>
        </div>
      </div>

      {/* 三级裂变奖励规则 */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 border-2 border-orange-200/50 dark:border-orange-800/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">🎯</span>
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">奖励规则</h3>
        </div>

        <div className="space-y-4 mb-6">
          {/* 场景1: A→B */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-purple-200/50 dark:border-purple-800/50">
            <div className="mb-4">
              <div className="text-lg font-black text-gray-900 dark:text-white mb-1">场景1：A邀请B</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">直接邀请关系</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-purple-200 dark:border-purple-700">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">直接邀请人 A</div>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{stats?.campaign.inviterReward || 3}次</div>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-pink-200 dark:border-pink-700">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">被邀请人 B</div>
                <div className="text-2xl font-black text-pink-600 dark:text-pink-400">{stats?.campaign.inviteeReward || 1}次</div>
              </div>
            </div>
          </div>

          {/* 场景2: B→C */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border-2 border-blue-200/50 dark:border-blue-800/50">
            <div className="mb-4">
              <div className="text-lg font-black text-gray-900 dark:text-white mb-1">场景2：B邀请C</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">C是B的一级、A的二级</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-blue-200 dark:border-blue-700">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">直接邀请人 B</div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats?.campaign.inviterReward || 3}次</div>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-cyan-200 dark:border-cyan-700">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">被邀请人 C</div>
                <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{stats?.campaign.inviteeReward || 1}次</div>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-purple-200 dark:border-purple-700">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">二级上级 A</div>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{(stats?.campaign.inviterReward || 3) / 2}次</div>
              </div>
            </div>
          </div>

          {/* 场景3: C→D */}
          <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border-2 border-green-200/50 dark:border-green-800/50">
            <div className="mb-4">
              <div className="text-lg font-black text-gray-900 dark:text-white mb-1">场景3：C邀请D</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">D是C的一级、B的二级、A的三级</div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-green-200 dark:border-green-700">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">直接邀请人 C</div>
                <div className="text-xl font-black text-green-600 dark:text-green-400">{stats?.campaign.inviterReward || 3}次</div>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-emerald-200 dark:border-emerald-700">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">被邀请人 D</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats?.campaign.inviteeReward || 1}次</div>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-blue-200 dark:border-blue-700">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">二级上级 B</div>
                <div className="text-xl font-black text-blue-600 dark:text-blue-400">{(stats?.campaign.inviterReward || 3) / 2}次</div>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-purple-200 dark:border-purple-700">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">三级上级 A</div>
                <div className="text-xl font-black text-purple-600 dark:text-purple-400">{(stats?.campaign.inviterReward || 3) / 4}次</div>
              </div>
            </div>
          </div>

          {/* 场景4: D→E */}
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl p-6 border-2 border-orange-200/50 dark:border-orange-800/50">
            <div className="mb-4">
              <div className="text-lg font-black text-gray-900 dark:text-white mb-1">场景4：D邀请E</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">E是D的一级、C的二级、B的三级、A的四级（不给）</div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-orange-200 dark:border-orange-700">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">直接邀请人 D</div>
                <div className="text-xl font-black text-orange-600 dark:text-orange-400">{stats?.campaign.inviterReward || 3}次</div>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-yellow-200 dark:border-yellow-700">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">被邀请人 E</div>
                <div className="text-xl font-black text-yellow-600 dark:text-yellow-400">{stats?.campaign.inviteeReward || 1}次</div>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-green-200 dark:border-green-700">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">二级上级 C</div>
                <div className="text-xl font-black text-green-600 dark:text-green-400">{(stats?.campaign.inviterReward || 3) / 2}次</div>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-blue-200 dark:border-blue-700">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">三级上级 B</div>
                <div className="text-xl font-black text-blue-600 dark:text-blue-400">{(stats?.campaign.inviterReward || 3) / 4}次</div>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-300 dark:border-gray-600">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">四级上级 A</div>
                <div className="text-xl font-black text-gray-400 dark:text-gray-600">0次</div>
              </div>
            </div>
          </div>
        </div>

        {/* 规则说明 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border-2 border-blue-200/50 dark:border-blue-800/50">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-lg">💡</span>
            </div>
            <div>
              <h4 className="text-lg font-black text-gray-900 dark:text-white mb-3">规则说明</h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  <span><strong className="text-blue-600 dark:text-blue-400">直接邀请人</strong>：永远获得 {stats?.campaign.inviterReward || 3} 次</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  <span><strong className="text-blue-600 dark:text-blue-400">被邀请人</strong>：永远获得 {stats?.campaign.inviteeReward || 1} 次</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  <span><strong className="text-blue-600 dark:text-blue-400">二级上级</strong>：获得 {(stats?.campaign.inviterReward || 3) / 2} 次（减半）</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  <span><strong className="text-blue-600 dark:text-blue-400">三级上级</strong>：获得 {(stats?.campaign.inviterReward || 3) / 4} 次（再减半）</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  <span><strong className="text-blue-600 dark:text-blue-400">四级及以上上级</strong>：获得 0 次（不再奖励）</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 邀请统计卡片 */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 border-2 border-purple-200/50 dark:border-purple-800/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">邀请统计</h3>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border-2 border-purple-200/50 dark:border-purple-800/50">
            <div className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {stats?.totalInvites || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">总邀请</div>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border-2 border-green-200/50 dark:border-green-800/50">
            <div className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              {stats?.successfulInvites || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">成功邀请</div>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl border-2 border-orange-200/50 dark:border-orange-800/50">
            <div className="text-4xl font-black bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent mb-2">
              {stats?.totalRewards || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">累计奖励</div>
          </div>
        </div>

        {stats && stats.invitees.length > 0 && (
          <div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>📝</span>
              <span>邀请记录</span>
            </h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats.invitees.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                      {item.inviteeId.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        用户 {item.inviteeId.substring(0, 8)}...
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.status === 'completed' ? (
                      <>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-bold">
                          ✓ 已完成
                        </span>
                        {item.inviterRewarded && (
                          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold">
                            +{item.inviterRewardAmount}次
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-bold">
                        ⏳ 待完成
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
