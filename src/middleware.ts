import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;

  // 如果用户未登录，除了登录页面外，所有页面都重定向到登录页
  if (!token) {
    // 允许访问登录页和API路由
    if (path === '/login' || path.startsWith('/api/auth')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 已登录用户的路由控制
  if (token) {
    // 已登录用户不能访问登录页
    if (path === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // 根据角色重定向首页
    if (path === '/') {
      if (token.role === 'TEACHER') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else {
        return NextResponse.redirect(new URL('/upload', request.url));
      }
    }

    // 限制管理页面只能被教师访问
    if (path.startsWith('/admin') && token.role !== 'TEACHER') {
      return NextResponse.redirect(new URL('/upload', request.url));
    }

    // 限制上传页面只能被学生访问
    if (path.startsWith('/upload') && token.role === 'TEACHER') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
