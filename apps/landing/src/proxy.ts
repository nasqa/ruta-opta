import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';

const handleI18nRouting = createMiddleware(routing);
const defaultHome = `/${routing.defaultLocale}`;

// The bare domain answers 200 with the Spanish home (canonical /es), so a scraper that follows no redirect still gets a page and its card. A
// browser that negotiates English still gets the 307 to /en: / never serves English HTML. Every other path is next-intl's alone
const proxy = (request: NextRequest) => {
  const response = handleI18nRouting(request);
  const location = response.headers.get('location');
  if (request.nextUrl.pathname !== '/' || response.status !== 307 || !location || new URL(location, request.url).pathname !== defaultHome) return response;

  const home = NextResponse.rewrite(new URL(`${defaultHome}${request.nextUrl.search}`, request.url));
  // The redirect's headers carry its Location; only a cookie next-intl set may move over
  for (const cookie of response.cookies.getAll()) home.cookies.set(cookie);
  return home;
};

export default proxy;

export const config = {
  // Every path except API routes, Next and Vercel internals, and files with an extension
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
