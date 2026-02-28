'use client'

import { useEffect, useState } from 'react'

export default function EarningsPage() {
  const [loading, setLoading] = useState(true)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    availableBalance: 0,
    withdrawn: 0,
    pending: 0,
  })
  const [incomeBreakdown, setIncomeBreakdown] = useState({
    vipSubscription: 0,
    tips: 0,
    ads: 0,
    other: 0,
  })
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    fetchEarnings()
  }, [])

  const fetchEarnings = async () => {
    try {
      const response = await fetch('/api/creator/earnings')
      const result = await response.json()
      if (result.success) {
        setEarnings(result.data.earnings)
        setIncomeBreakdown(result.data.incomeBreakdown)
        setTransactions(result.data.transactions)
      }
    } catch (error) {
      console.error('获取收益失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0) {
      alert('请输入有效金额')
      return
    }
    if (amount > earnings.availableBalance) {
      alert('余额不足')
      return
    }

    try {
      const response = await fetch('/api/creator/earnings/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      const result = await response.json()
      if (result.success) {
        alert('提现申请已提交')
        setShowWithdraw(false)
        setWithdrawAmount('')
        fetchEarnings()
      } else {
        alert(result.error || '提现失败')
      }
    } catch (error) {
      alert('提现失败')
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          收益管理
        </h1>
        <button
          onClick={() => setShowWithdraw(true)}
          disabled={earnings.availableBalance <= 0}
          className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          💰 申请提现
        </button>
      </div>

      {/* 收益概览 */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { icon: '💰', label: '累计收益', value: `¥${earnings.totalEarnings.toFixed(2)}`, color: 'orange' },
          { icon: '💵', label: '可提现余额', value: `¥${earnings.availableBalance.toFixed(2)}`, color: 'green' },
          { icon: '🎁', label: '已提现', value: `¥${earnings.withdrawn.toFixed(2)}`, color: 'blue' },
          { icon: '⏳', label: '待结算', value: `¥${earnings.pending.toFixed(2)}`, color: 'yellow' },
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

      {/* 收益来源 */}
      <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-indigo-200/50 mb-8">
        <h2 className="text-2xl font-black text-gray-800 mb-6">收益来源</h2>
        <div className="grid grid-cols-4 gap-6">
          {[
            { icon: '👑', label: 'VIP订阅', value: incomeBreakdown.vipSubscription },
            { icon: '🎁', label: '打赏收入', value: incomeBreakdown.tips },
            { icon: '📢', label: '广告分成', value: incomeBreakdown.ads },
            { icon: '💎', label: '其他收入', value: incomeBreakdown.other },
          ].map((item, i) => (
            <div key={i} className="text-center p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50">
              <div className="text-4xl mb-2">{item.icon}</div>
              <p className="text-gray-600 text-sm mb-1">{item.label}</p>
              <p className="text-2xl font-black text-gray-800">¥{item.value.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 收益明细 */}
      <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-indigo-200/50">
        <h2 className="text-2xl font-black text-gray-800 mb-6">收益明细</h2>
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-indigo-50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-2xl">
                    {tx.type === 'vip' ? '👑' : tx.type === 'tip' ? '🎁' : tx.type === 'ad' ? '📢' : '💎'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{tx.description}</p>
                    <p className="text-sm text-gray-500">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-black ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount > 0 ? '+' : ''}¥{Math.abs(tx.amount).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">{tx.status === 'completed' ? '已完成' : tx.status === 'pending' ? '待结算' : '处理中'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💰</div>
            <p className="text-gray-500">暂无收益记录</p>
          </div>
        )}
      </div>

      {/* 提现弹窗 */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowWithdraw(false)}>
          <div className="bg-white rounded-3xl p-10 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-3xl font-black text-gray-800 mb-6">申请提现</h2>
            <div className="mb-6">
              <p className="text-gray-600 mb-2">可提现余额</p>
              <p className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ¥{earnings.availableBalance.toFixed(2)}
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">提现金额</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="请输入提现金额"
                className="w-full px-6 py-4 border-2 border-indigo-200 rounded-2xl focus:border-indigo-600 focus:outline-none text-lg"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowWithdraw(false)}
                className="flex-1 py-4 bg-gray-200 text-gray-700 rounded-2xl font-bold"
              >
                取消
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold"
              >
                确认提现
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
