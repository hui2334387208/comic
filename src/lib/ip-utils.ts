/**
 * 安全获取客户端真实IP地址
 * 处理各种代理和CDN情况
 */
// 兼容 Next.js / NextAuth 在不同运行时下可能提供的两种 headers：
// - Web Headers（有 get 方法）
// - Node IncomingHttpHeaders（普通对象）
function readHeader(
  headers: Headers | Record<string, string | string[] | undefined>,
  key: string,
): string | null {
  // Web Headers
  if (headers && typeof (headers as any).get === 'function') {
    return (headers as Headers).get(key)
  }
  // Node 风格对象（大小写不敏感，统一转小写）
  const obj = headers as Record<string, string | string[] | undefined>
  const value = obj[key] ?? obj[key.toLowerCase()]
  if (Array.isArray(value)) return value[0] ?? null
  return (value as string | undefined) ?? null
}

export function getClientIP(request: Request | { headers: any }): string {
  const headers = request.headers as any
  
  // 按优先级检查各种IP头
  const ipHeaders = [
    'cf-connecting-ip',        // Cloudflare
    'x-real-ip',              // Nginx
    'x-forwarded-for',        // 标准代理头
    'x-client-ip',            // 其他代理
    'x-forwarded',            // 其他代理
    'forwarded-for',          // 其他代理
    'forwarded',              // 其他代理
  ]
  
  for (const header of ipHeaders) {
    const value = readHeader(headers, header)
    if (value) {
      // 处理多个IP的情况（代理链）
      const ips = value.split(',').map(ip => ip.trim())
      
      // 过滤掉私有IP和本地IP
      const publicIPs = ips.filter(ip => {
        if (!isValidIP(ip)) return false
        
        // 检查是否是私有IP
        if (isPrivateIP(ip)) return false
        
        // 检查是否是本地IP
        if (isLocalIP(ip)) return false
        
        return true
      })
      
      // 返回第一个有效的公网IP
      if (publicIPs.length > 0) {
        return publicIPs[0]
      }
      
      // 如果没有公网IP，返回第一个有效IP
      const validIPs = ips.filter(ip => isValidIP(ip))
      if (validIPs.length > 0) {
        return validIPs[0]
      }
    }
  }
  
  // 如果所有方法都失败，返回unknown
  return 'unknown'
}

/**
 * 验证IP地址格式
 */
function isValidIP(ip: string): boolean {
  // IPv4 正则
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  
  // IPv6 正则（简化版）
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

/**
 * 检查是否是私有IP
 */
function isPrivateIP(ip: string): boolean {
  // IPv4 私有地址范围
  const privateRanges = [
    /^10\./,                    // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./,              // 192.168.0.0/16
    /^127\./,                   // 127.0.0.0/8 (localhost)
    /^169\.254\./,              // 169.254.0.0/16 (link-local)
  ]
  
  return privateRanges.some(range => range.test(ip))
}

/**
 * 检查是否是本地IP
 */
function isLocalIP(ip: string): boolean {
  const localIPs = [
    '::1',           // IPv6 localhost
    '0.0.0.0',       // 无效地址
    'localhost',     // 主机名
  ]
  
  return localIPs.includes(ip.toLowerCase())
}

/**
 * 获取用户代理信息
 */
export function getUserAgent(request: Request | { headers: any }): string | null {
  return readHeader(request.headers as any, 'user-agent')
}

/**
 * 获取地理位置信息（如果有的话）
 */
export function getLocationInfo(request: Request | { headers: any }): {
  country?: string
  city?: string
  region?: string
} {
  const headers = request.headers as any
  
  return {
    country: readHeader(headers, 'cf-ipcountry') || readHeader(headers, 'x-country') || undefined,
    city: readHeader(headers, 'cf-ipcity') || readHeader(headers, 'x-city') || undefined,
    region: readHeader(headers, 'cf-region') || readHeader(headers, 'x-region') || undefined,
  }
}
