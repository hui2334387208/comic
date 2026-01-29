'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Link } from '@/i18n/navigation';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  requirement: any;
  rarity: string;
  isActive: boolean;
}

interface UserBadge {
  badgeId: string;
  earnedAt: string;
  progress: number;
}

interface BadgeProgress {
  badge: Badge;
  userBadge?: UserBadge;
  currentProgress: number;
  targetProgress: number;
  isUnlocked: boolean;
}

interface ClientAchievementsPageProps {
  locale: string;
}

export default function ClientAchievementsPage({ locale }: ClientAchievementsPageProps) {
  const { data: session } = useSession();
  const [badges, setBadges] = useState<BadgeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      // 模拟API调用 - 实际应该从后端获取
      const mockBadges: BadgeProgress[] = [
        {
          badge: {
            id: '1',
            name: '初学者',
            description: '完成第一个课程学习',
            icon: '🌱',
            color: 'green',
            category: 'course_completion',
            requirement: { type: 'course_completion', count: 1 },
            rarity: 'common',
            isActive: true
          },
          currentProgress: 1,
          targetProgress: 1,
          isUnlocked: true,
          userBadge: {
            badgeId: '1',
            earnedAt: '2024-01-15T10:00:00Z',
            progress: 100
          }
        },
        {
          badge: {
            id: '2',
            name: '勤奋学习者',
            description: '连续学习7天',
            icon: '🔥',
            color: 'red',
            category: 'streak',
            requirement: { type: 'daily_streak', count: 7 },
            rarity: 'common',
            isActive: true
          },
          currentProgress: 5,
          targetProgress: 7,
          isUnlocked: false
        },
        {
          badge: {
            id: '3',
            name: '对联新手',
            description: '完成50道练习题',
            icon: '📝',
            color: 'blue',
            category: 'mastery',
            requirement: { type: 'exercise_completion', count: 50 },
            rarity: 'common',
            isActive: true
          },
          currentProgress: 23,
          targetProgress: 50,
          isUnlocked: false
        },
        {
          badge: {
            id: '4',
            name: '创作达人',
            description: '创作10副原创对联',
            icon: '✨',
            color: 'purple',
            category: 'creativity',
            requirement: { type: 'creation_count', count: 10 },
            rarity: 'rare',
            isActive: true
          },
          currentProgress: 3,
          targetProgress: 10,
          isUnlocked: false
        },
        {
          badge: {
            id: '5',
            name: '学习之星',
            description: '连续学习30天',
            icon: '⭐',
            color: 'gold',
            category: 'streak',
            requirement: { type: 'daily_streak', count: 30 },
            rarity: 'epic',
            isActive: true
          },
          currentProgress: 5,
          targetProgress: 30,
          isUnlocked: false
        },
        {
          badge: {
            id: '6',
            name: '对联大师',
            description: '完成所有高级课程并获得90%以上成绩',
            icon: '👑',
            color: 'gold',
            category: 'mastery',
            requirement: { type: 'advanced_mastery', score: 90 },
            rarity: 'legendary',
            isActive: true
          },
          currentProgress: 0,
          targetProgress: 1,
          isUnlocked: false
        }
      ];
      
      setBadges(mockBadges);
    } catch (error) {
      console.error('获取徽章数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'course_completion': return '课程完成';
      case 'streak': return '连续学习';
      case 'mastery': return '技能掌握';
      case 'creativity': return '创作能力';
      default: return category;
    }
  };

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'common': return '普通';
      case 'rare': return '稀有';
      case 'epic': return '史诗';
      case 'legendary': return '传说';
      default: return rarity;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-500';
      case 'rare': return 'from-blue-400 to-blue-500';
      case 'epic': return 'from-purple-400 to-purple-500';
      case 'legendary': return 'from-yellow-400 to-yellow-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getBadgeColor = (color: string) => {
    switch (color) {
      case 'green': return 'from-green-500 to-green-600';
      case 'red': return 'from-red-500 to-red-600';
      case 'blue': return 'from-blue-500 to-blue-600';
      case 'purple': return 'from-purple-500 to-purple-600';
      case 'gold': return 'from-yellow-500 to-yellow-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const filteredBadges = badges.filter(badgeProgress => {
    const categoryMatch = selectedCategory === 'all' || badgeProgress.badge.category === selectedCategory;
    const rarityMatch = selectedRarity === 'all' || badgeProgress.badge.rarity === selectedRarity;
    return categoryMatch && rarityMatch;
  });

  const unlockedCount = badges.filter(b => b.isUnlocked).length;
  const totalCount = badges.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🏅</div>
          <div className="text-red-600 font-bold text-xl">加载成就数据中...</div>
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
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h1 className="text-5xl font-black text-red-700 mb-4 relative">
              成就系统
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full opacity-80"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-orange-600 rounded-full opacity-60"></div>
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
          </div>
          <p className="text-red-600 text-lg font-bold mt-6 max-w-2xl mx-auto leading-relaxed">
            解锁学习徽章，展示学习成果，激励持续学习
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

        {/* 成就统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">🏆</div>
            <div className="text-sm text-red-200">已解锁</div>
            <div className="text-xl font-bold">{unlockedCount}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-sm text-orange-200">总徽章</div>
            <div className="text-xl font-bold">{totalCount}</div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm text-red-200">完成度</div>
            <div className="text-xl font-bold">{Math.round((unlockedCount / totalCount) * 100)}%</div>
          </div>
          <div className="bg-gradient-to-br from-red-700 to-red-800 rounded-xl p-4 text-white text-center shadow-lg">
            <div className="text-2xl mb-2">⭐</div>
            <div className="text-sm text-red-200">稀有徽章</div>
            <div className="text-xl font-bold">{badges.filter(b => b.badge.rarity !== 'common' && b.isUnlocked).length}</div>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 justify-center mb-4">
            <div className="flex gap-2">
              <span className="text-red-700 font-bold">类别:</span>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg font-bold transition-all text-sm ${
                  selectedCategory === 'all'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-white text-red-600 border-2 border-red-200 hover:border-red-400'
                }`}
              >
                全部
              </button>
              {['course_completion', 'streak', 'mastery', 'creativity'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-bold transition-all text-sm ${
                    selectedCategory === category
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'bg-white text-red-600 border-2 border-red-200 hover:border-red-400'
                  }`}
                >
                  {getCategoryText(category)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="flex gap-2">
              <span className="text-red-700 font-bold">稀有度:</span>
              <button
                onClick={() => setSelectedRarity('all')}
                className={`px-4 py-2 rounded-lg font-bold transition-all text-sm ${
                  selectedRarity === 'all'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-white text-red-600 border-2 border-red-200 hover:border-red-400'
                }`}
              >
                全部
              </button>
              {['common', 'rare', 'epic', 'legendary'].map((rarity) => (
                <button
                  key={rarity}
                  onClick={() => setSelectedRarity(rarity)}
                  className={`px-4 py-2 rounded-lg font-bold transition-all text-sm ${
                    selectedRarity === rarity
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'bg-white text-red-600 border-2 border-red-200 hover:border-red-400'
                  }`}
                >
                  {getRarityText(rarity)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 徽章网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBadges.map((badgeProgress) => {
            const { badge, isUnlocked, currentProgress, targetProgress, userBadge } = badgeProgress;
            const progressPercentage = Math.min((currentProgress / targetProgress) * 100, 100);
            
            return (
              <div
                key={badge.id}
                className={`relative bg-white rounded-2xl p-6 shadow-xl border-4 transition-all duration-300 hover:shadow-2xl ${
                  isUnlocked 
                    ? 'border-yellow-400 hover:border-yellow-500' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${!isUnlocked ? 'opacity-75' : ''}`}
              >
                {/* 稀有度标识 */}
                <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getRarityColor(badge.rarity)}`}>
                  {getRarityText(badge.rarity)}
                </div>

                {/* 解锁状态 */}
                {isUnlocked && (
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                    ✓
                  </div>
                )}

                {/* 徽章图标 */}
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-4xl bg-gradient-to-br ${getBadgeColor(badge.color)} ${
                  isUnlocked ? 'shadow-lg' : 'grayscale'
                }`}>
                  {badge.icon}
                </div>

                {/* 徽章信息 */}
                <div className="text-center mb-4">
                  <h3 className={`text-lg font-black mb-2 ${isUnlocked ? 'text-red-700' : 'text-gray-500'}`}>
                    {badge.name}
                  </h3>
                  <p className={`text-sm leading-relaxed ${isUnlocked ? 'text-gray-700' : 'text-gray-500'}`}>
                    {badge.description}
                  </p>
                </div>

                {/* 类别标签 */}
                <div className="text-center mb-4">
                  <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                    {getCategoryText(badge.category)}
                  </span>
                </div>

                {/* 进度条 */}
                {!isUnlocked && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">进度</span>
                      <span className="text-red-600 font-bold">
                        {currentProgress}/{targetProgress}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-center">
                      {Math.round(progressPercentage)}% 完成
                    </div>
                  </div>
                )}

                {/* 解锁时间 */}
                {isUnlocked && userBadge && (
                  <div className="text-center">
                    <div className="text-xs text-green-600 font-bold">
                      🎉 已解锁
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(userBadge.earnedAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 空状态 */}
        {filteredBadges.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏅</div>
            <div className="text-red-600 font-bold text-xl mb-2">暂无徽章</div>
            <div className="text-gray-600">该筛选条件下暂时没有可用徽章</div>
          </div>
        )}

        {/* 激励信息 */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 text-white text-center shadow-xl mt-12">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-2xl font-black mb-4">继续努力，解锁更多成就！</h3>
          <p className="text-red-100 text-lg mb-6">
            每一个徽章都代表着您在对联学习路上的进步和成长
          </p>
          <div className="flex justify-center gap-6">
            <div className="bg-red-500 rounded-xl p-4">
              <div className="text-sm text-red-100">下一个目标</div>
              <div className="text-xl font-bold">
                {badges.find(b => !b.isUnlocked)?.badge.name || '全部完成！'}
              </div>
            </div>
            <div className="bg-red-500 rounded-xl p-4">
              <div className="text-sm text-red-100">总体进度</div>
              <div className="text-xl font-bold">
                {Math.round((unlockedCount / totalCount) * 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* 底部装饰 */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-6 bg-red-600 text-white px-8 py-4 rounded-full shadow-xl">
            <span className="text-2xl">🏅</span>
            <span className="font-bold text-lg">成就解锁，荣耀见证</span>
            <span className="text-2xl">🏅</span>
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