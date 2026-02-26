import { randomUUID } from 'crypto'

import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { compare } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { AuthOptions, Session } from 'next-auth'
import type { AdapterUser } from 'next-auth/adapters'
import CredentialsProvider from 'next-auth/providers/credentials'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'

import { db } from '@/db'
import { users, accounts, sessions, verificationTokens } from '@/db/schema'
import { logger } from '@/lib/logger'
import { checkAccountLock, recordLoginFailure, recordLoginSuccess } from '@/lib/account-lock'
import { checkFrequentSuccessLogin, recordSuccessLogin } from '@/lib/success-login-detection'
import { getClientIP, getUserAgent } from '@/lib/ip-utils'
import { createReferralCode } from '@/lib/referral-utils'


const adapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
})

adapter.createUser = async (user: Omit<AdapterUser, 'id'>) => {
  const id = randomUUID()

  // 从邮箱生成一个唯一的用户名
  const username = `${user.email?.split('@')[0]}_${randomUUID().substring(
    0,
    4,
  )}`

  await db.insert(users).values({ ...user, id, username })
  const newUser = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .then((res) => res[0])
  
  // 为OAuth用户创建邀请码
  const referralCodeResult = await createReferralCode(id)
  if (referralCodeResult.success) {
    console.log('OAuth用户邀请码创建成功:', referralCodeResult.code)
  } else {
    console.warn('OAuth用户邀请码创建失败:', referralCodeResult.message)
  }
  
  return newUser as AdapterUser
}

adapter.linkAccount = async (account) => {
  const id = randomUUID()
  await db.insert(accounts).values({ id, ...account })
}

export const authOptions: AuthOptions = {
  adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: false,
      httpOptions: {
        timeout: Number(process.env.OAUTH_HTTP_TIMEOUT_MS) || 30000,
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: false,
      httpOptions: {
        timeout: Number(process.env.OAUTH_HTTP_TIMEOUT_MS) || 30000,
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          await logger.error({
            module: 'auth',
            action: 'login',
            description: '登录失败：未提供邮箱或密码',
          })
          throw new Error('请输入邮箱和密码')
        }

        // 获取客户端IP和User-Agent
        const ip = req ? getClientIP(req as any) : 'unknown'
        const userAgent = req ? getUserAgent(req as any) : null

        // 先查询用户信息
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        })

        // 检查账户是否被锁定
        const lockResult = await checkAccountLock(credentials.email, user)
        if (lockResult.isLocked) {

          await logger.warning({
            module: 'auth',
            action: 'login_blocked',
            description: `登录被阻止：账户已锁定 (${credentials.email}, IP: ${ip}, UA: ${userAgent})`,
          })

          // 构建详细的锁定信息
          let errorMessage = '账户已被锁定'
          if (lockResult.lockReason) {
            errorMessage += `：${lockResult.lockReason}`
          }
          if (lockResult.unlockTime) {
            const unlockTime = new Date(lockResult.unlockTime)
            const now = new Date()
            const minutesLeft = Math.ceil((unlockTime.getTime() - now.getTime()) / (1000 * 60))
            if (minutesLeft > 0) {
              errorMessage += `，请等待 ${minutesLeft} 分钟后重试`
            } else {
              errorMessage += '，请稍后重试'
            }
          } else {
            errorMessage += '，请稍后重试'
          }
          
          throw new Error(errorMessage)
        }

        if (!user) {
          await recordLoginFailure(credentials.email, null)
          await logger.error({
            module: 'auth',
            action: 'login',
            description: `登录失败：用户不存在 (${credentials.email})`,
          })
          throw new Error('邮箱或密码错误')
        }

        if (!user.emailVerified) {
          await recordLoginFailure(credentials.email, user)
          await logger.error({
            module: 'auth',
            action: 'login',
            description: `登录失败：邮箱未验证 (${credentials.email})`,
          })
          throw new Error('请先验证您的邮箱地址，请检查您的邮箱并点击验证链接')
        }

        // 检查用户是否有密码（OAuth 用户可能没有密码）
        if (!user.password) {
          await recordLoginFailure(credentials.email, user)
          await logger.error({
            module: 'auth',
            action: 'login',
            description: `登录失败：该账户使用第三方登录 (${credentials.email})`,
          })
          throw new Error('该账户使用第三方登录，请使用 Google 或 GitHub 登录')
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          const failureResult = await recordLoginFailure(credentials.email, user)

          await logger.error({
            module: 'auth',
            action: 'login',
            description: `登录失败：密码错误 (${credentials.email})`,
          })

          if (failureResult.isLocked) {
            throw new Error('登录失败，请稍后重试')
          } else {
            throw new Error('邮箱或密码错误')
          }
        }

        // 检查频繁成功登录
        const frequentLoginResult = await checkFrequentSuccessLogin(credentials.email, user)

        if (!frequentLoginResult.allowed) {
          await logger.warning({
            module: 'auth',
            action: 'login_blocked_frequent_success',
            description: `登录被阻止：频繁成功登录 (${credentials.email})`,
          })

          // 使用具体的频繁登录错误信息
          let errorMessage = '登录失败'
          if (frequentLoginResult.warning) {
            errorMessage = frequentLoginResult.warning
          } else if (frequentLoginResult.lockout) {
            errorMessage = '检测到异常频繁登录，账户已被临时锁定。请等待5分钟后重试'
          } else {
            errorMessage = '登录过于频繁，请稍后重试'
          }
          
          throw new Error(errorMessage)
        }

        // 记录成功登录
        await recordSuccessLogin(credentials.email, user)

        // 重置失败次数
        await recordLoginSuccess(credentials.email)

        // 记录警告信息（如果有）
        if (frequentLoginResult.warning) {
          await logger.warning({
            module: 'auth',
            action: 'frequent_success_login_detected',
            description: `检测到频繁成功登录 (${credentials.email}): ${frequentLoginResult.warning}`,
          })
        }

        await logger.info({
          module: 'auth',
          action: 'login',
          description: `用户登录成功 (${user.email})`,
        })

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.username,
          role: user.role,
          avatar: user.avatar || undefined,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'credentials') {
        return true
      }

      if (account?.provider === 'google' || account?.provider === 'github') {
        // The Drizzle adapter will handle user creation and account linking automatically.
        // We can add custom logic here if needed, for example, logging.
        logger.info({
          module: 'auth',
          action: 'oauth_signin',
          description: `OAuth sign-in attempt (${user.email}, provider: ${account.provider})`,
        })

        return true
      }

      // Deny sign-in for other providers by default.
      return false
    },
    async jwt({ token, user }: { token: any; user: any; }) {
      if (user) {
        token.role = user.role
        token.id = user.id
        token.avatar = user.avatar || user.image
      }
      return token
    },
    async session({ session, token }: { session: Session; token: any }) {
      if (session?.user) {
        session.user.role = token.role
        session.user.id = token.id
        session.user.avatar = token.avatar
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // 如果是退出登录，直接返回后台登录页
      if (url.includes('signout')) {
        return `${baseUrl}/zh/admin/login`
      }
      return url
    },
  },
  pages: {
    signIn: '/sign-in',
    error: '/error',
  },
  // session 1 天内有效，超过 1 天会自动更新；超过 3 天内没有任何操作，就会过期，useSession() auth() 返回 null
  session: {
    strategy: 'jwt' as const,
    maxAge: 3 * 24 * 60 * 60, // 3 days. The session will expire in 3 days.
    updateAge: 24 * 3600,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== 'production',
}
