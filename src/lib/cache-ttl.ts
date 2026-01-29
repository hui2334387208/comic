type CacheTier = 'dynamic' | 'semiStatic' | 'static'

interface CacheTTLConfig {
  redisTtl: number
  httpTtl: number
  swrTtl: number
}

// const DEFAULTS: Record<CacheTier, CacheTTLConfig> = {
//   dynamic: {
//     redisTtl: 30 * 60, // 30 分钟
//     httpTtl: 5 * 60, // 5 分钟
//     swrTtl: 2 * 60, // 2 分钟
//   },
//   semiStatic: {
//     redisTtl: 45 * 60, // 45 分钟
//     httpTtl: 15 * 60, // 15 分钟
//     swrTtl: 5 * 60, // 5 分钟
//   },
//   static: {
//     redisTtl: 60 * 60, // 60 分钟
//     httpTtl: 20 * 60, // 20 分钟
//     swrTtl: 10 * 60, // 10 分钟
//   },
// }

// const DEFAULTS: Record<CacheTier, CacheTTLConfig> = {
//   dynamic: {
//     redisTtl: 15 * 24 * 60 * 60, // 15 天
//     httpTtl: 5 * 24 * 60 * 60, // 5 天
//     swrTtl: 24 * 60 * 60, // 1 天
//   },
//   semiStatic: {
//     redisTtl: 20 * 24 * 60 * 60, // 20 天
//     httpTtl: 7 * 24 * 60 * 60, // 7 天
//     swrTtl: 2 * 24 * 60 * 60, // 2 天
//   },
//   static: {
//     redisTtl: 30 * 24 * 60 * 60, // 30 天
//     httpTtl: 14 * 24 * 60 * 60, // 14 天
//     swrTtl: 4 * 24 * 60 * 60, // 4 天
//   },
// }

const DEFAULTS: Record<CacheTier, CacheTTLConfig> = {
  dynamic: {
    redisTtl: 1,
    httpTtl: 1,
    swrTtl: 1
  },
  semiStatic: {
    redisTtl: 1,
    httpTtl: 1,
    swrTtl: 1
  },
  static: {
    redisTtl: 1,
    httpTtl: 1,
    swrTtl: 1
  },
}

const ENV_KEYS: Record<CacheTier, Record<keyof CacheTTLConfig, string>> = {
  dynamic: {
    redisTtl: 'CACHE_TIMELINE_DYNAMIC_REDIS_TTL',
    httpTtl: 'CACHE_TIMELINE_DYNAMIC_HTTP_TTL',
    swrTtl: 'CACHE_TIMELINE_DYNAMIC_SWR_TTL',
  },
  semiStatic: {
    redisTtl: 'CACHE_TIMELINE_SEMI_STATIC_REDIS_TTL',
    httpTtl: 'CACHE_TIMELINE_SEMI_STATIC_HTTP_TTL',
    swrTtl: 'CACHE_TIMELINE_SEMI_STATIC_SWR_TTL',
  },
  static: {
    redisTtl: 'CACHE_TIMELINE_STATIC_REDIS_TTL',
    httpTtl: 'CACHE_TIMELINE_STATIC_HTTP_TTL',
    swrTtl: 'CACHE_TIMELINE_STATIC_SWR_TTL',
  },
}

const parseEnvNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return parsed
}

const buildConfig = (): Record<CacheTier, CacheTTLConfig> => {
  const config = {} as Record<CacheTier, CacheTTLConfig>

  (Object.keys(DEFAULTS) as CacheTier[]).forEach((tier) => {
    const defaults = DEFAULTS[tier]
    const envKeys = ENV_KEYS[tier]
    config[tier] = {
      redisTtl: parseEnvNumber(process.env[envKeys.redisTtl], defaults.redisTtl),
      httpTtl: parseEnvNumber(process.env[envKeys.httpTtl], defaults.httpTtl),
      swrTtl: parseEnvNumber(process.env[envKeys.swrTtl], defaults.swrTtl),
    }
  })

  return config
}

const CACHE_TTL_CONFIG = buildConfig()

export const getCacheTTL = (tier: CacheTier): CacheTTLConfig => CACHE_TTL_CONFIG[tier]
export const getCacheDefaults = (): Record<CacheTier, CacheTTLConfig> => DEFAULTS


