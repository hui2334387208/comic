'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [name, setName] = useState(session?.user?.name || '')
  const [bio, setBio] = useState('')

  const handleSave = () => {
    alert('设置保存成功')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8">
        创作设置
      </h1>

      <div className="bg-white rounded-3xl p-10 shadow-2xl border-4 border-indigo-200/50 mb-6">
        <h2 className="text-2xl font-black text-gray-800 mb-6">个人资料</h2>
        
        <div className="space-y-6">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
              {session?.user?.avatar ? (
                <img src={session.user.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span>{session?.user?.name?.[0] || '创'}</span>
              )}
            </div>
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
              更换头像
            </button>
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-3">昵称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-6 py-4 border-2 border-indigo-200 rounded-2xl focus:border-indigo-600 focus:outline-none text-lg"
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-3">邮箱</label>
            <input
              type="email"
              value={session?.user?.email || ''}
              disabled
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl bg-gray-50 text-lg"
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-3">个人简介</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="介绍一下你自己..."
              className="w-full px-6 py-4 border-2 border-indigo-200 rounded-2xl focus:border-indigo-600 focus:outline-none text-lg"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all"
          >
            保存设置
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-10 shadow-2xl border-4 border-indigo-200/50">
        <h2 className="text-2xl font-black text-gray-800 mb-6">创作偏好</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-3">默认语言</label>
            <select className="w-full px-6 py-4 border-2 border-indigo-200 rounded-2xl focus:border-indigo-600 focus:outline-none text-lg">
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-3">默认画风</label>
            <select className="w-full px-6 py-4 border-2 border-indigo-200 rounded-2xl focus:border-indigo-600 focus:outline-none text-lg">
              <option value="anime">日式动漫</option>
              <option value="manga">日式漫画</option>
              <option value="realistic">写实风格</option>
              <option value="cartoon">卡通风格</option>
            </select>
          </div>

          <button className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all">
            保存偏好
          </button>
        </div>
      </div>
    </div>
  )
}
