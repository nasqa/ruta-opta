import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';

const handleI18nRouting = createMiddleware(routing);
const defaultHome = `/${routing.defaultLocale}`;
const confirmPaths = new Set<string>(routing.locales.map((locale) => `/${locale}${routing.pathnames['/confirm'][locale]}`));

// The bare domain answers 200 with the Spanish home (canonical /es), so a scraper that follows no redirect still gets a page and its card. A
// browser that negotiates English still gets the 307 to /en: / never serves English HTML. Beyond that and the confirm pages' header, every
// path is next-intl's alone
const proxy = (request: NextRequest) => {
  const response = handleI18nRouting(request);
  // A confirm page's address carries the signed token, and React writes async scripts above the page's referrer meta tag, so the policy goes
  // in a response header too. Set here, which sees the address the browser asked for: on Netlify, next.config headers are matched after
  // next-intl's rewrite. Only these pages: the waitlist reads utm_source from the Referer
  if (confirmPaths.has(request.nextUrl.pathname)) response.headers.set('Referrer-Policy', 'no-referrer');
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
