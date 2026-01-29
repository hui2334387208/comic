import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

// 公共路径列表
const publicPaths = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/api/auth',
  '/admin/sign-up',
]

// 检查是否是公共路径
function isPublicPath(path: string): boolean {
  return publicPaths.some(publicPath => path.includes(publicPath))
}

export default async function middleware(req: NextRequest) {
  // const { pathname } = req.nextUrl;

  // 获取用户token
  // const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // 处理根路径
  // if (pathname === '/') {
  //   if (!token) {
  //     return NextResponse.redirect(new URL('/sign-in', req.url));
  //   }
  //   return NextResponse.redirect(new URL('/admin', req.url));
  // }

  // 检查是否是后台路由
  // const isAdminRoute = pathname.startsWith('/admin');
  // const isAdminApiRoute = pathname.startsWith('/api/admin');
  // const isAdminLoginPage = pathname === '/admin/sign-in';
  // const isAdminRegisterPage = pathname === '/admin/sign-up';
  // const isFrontendLoginPage = pathname === '/sign-in';

  // 如果是登录页面或注册页面
  // if (isAdminLoginPage || isAdminRegisterPage || isFrontendLoginPage) {
  //   // 已登录用户重定向到对应的首页
  //   if (token) {
  //     if (isAdminLoginPage || isAdminRegisterPage) {
  //       return NextResponse.redirect(new URL('/admin', req.url));
  //     } else {
  //       return NextResponse.redirect(new URL('/', req.url));
  //     }
  //   }
  //   // 未登录用户允许访问登录页和注册页
  //   return intlMiddleware(req);
  // }

  // 后台路由权限检查
  // if (isAdminRoute || isAdminApiRoute) {
  //   // 未登录用户重定向到后台登录页
  //   if (!token) {
  //     return NextResponse.redirect(new URL('/admin/sign-in', req.url));
  //   }
  //   // 非管理员用户重定向到前台登录页
  //   if (token.role !== 'admin') {
  //     return NextResponse.redirect(new URL('/sign-in', req.url));
  //   }
  //   // 管理员允许访问
  //   return intlMiddleware(req);
  // }

  // 前台路由权限检查
  // if (!isAdminRoute && !isAdminApiRoute) {
  //   // 如果是公共路径，允许访问
  //   if (isPublicPath(pathname)) {
  //     return intlMiddleware(req);
  //   }
  //   // 未登录用户重定向到前台登录页
  //   if (!token) {
  //     return NextResponse.redirect(new URL('/sign-in', req.url));
  //   }
  //   // 已登录用户允许访问
  //   return intlMiddleware(req);
  // }

  return intlMiddleware(req)
}

export const config = {
  matcher: [
    '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
  ],
}
