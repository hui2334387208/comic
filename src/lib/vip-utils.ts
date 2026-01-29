/**
 * VIP相关工具函数
 */

/**
 * 格式化时长显示
 * @param days 天数
 * @returns 格式化后的时长字符串
 */
export function formatDuration(days: number): string {
  if (days < 30) {
    return `${days}天`
  } else if (days < 365) {
    const months = Math.floor(days / 30)
    const remainingDays = days % 30
    if (remainingDays === 0) {
      return `${months}个月`
    } else {
      return `${months}个月${remainingDays}天`
    }
  } else {
    const years = Math.floor(days / 365)
    const remainingDays = days % 365
    if (remainingDays === 0) {
      return `${years}年`
    } else {
      const months = Math.floor(remainingDays / 30)
      const finalDays = remainingDays % 30
      if (months === 0) {
        return `${years}年${finalDays}天`
      } else {
        return `${years}年${months}个月${finalDays}天`
      }
    }
  }
}

/**
 * 计算到期时间
 * @param startDate 开始时间
 * @param days 天数
 * @returns 到期时间
 */
export function calculateExpireDate(startDate: Date, days: number): Date {
  const expireDate = new Date(startDate)
  expireDate.setDate(expireDate.getDate() + days)
  return expireDate
}

/**
 * 计算剩余天数
 * @param expireDate 到期时间
 * @returns 剩余天数
 */
export function calculateRemainingDays(expireDate: Date): number {
  const now = new Date()
  const diffTime = expireDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

/**
 * 检查是否即将到期（30天内）
 * @param expireDate 到期时间
 * @returns 是否即将到期
 */
export function isExpiringSoon(expireDate: Date): boolean {
  const remainingDays = calculateRemainingDays(expireDate)
  return remainingDays <= 30 && remainingDays > 0
}

/**
 * 检查是否已过期
 * @param expireDate 到期时间
 * @returns 是否已过期
 */
export function isExpired(expireDate: Date): boolean {
  return new Date() > expireDate
}

/**
 * 获取时长预设选项
 */
export const durationPresets = [
  { label: '7天', value: 7 },
  { label: '15天', value: 15 },
  { label: '30天', value: 30 },
  { label: '60天', value: 60 },
  { label: '90天', value: 90 },
  { label: '180天', value: 180 },
  { label: '365天', value: 365 },
  { label: '730天', value: 730 },
]

/**
 * 计算套餐的日均价格
 * @param price 套餐价格
 * @param days 天数
 * @returns 日均价格
 */
export function calculateDailyPrice(price: number, days: number): number {
  return price / days
}

/**
 * 格式化价格显示
 * @param price 价格
 * @returns 格式化后的价格字符串
 */
export function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`
}

/**
 * 计算折扣百分比
 * @param originalPrice 原价
 * @param currentPrice 现价
 * @returns 折扣百分比
 */
export function calculateDiscount(originalPrice: number, currentPrice: number): number {
  if (originalPrice <= currentPrice) return 0
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
}
