import { cookies } from 'next/headers';

export const ACCESS_TOKEN_COOKIE = 'uchn_access_token';
export const REFRESH_TOKEN_COOKIE = 'uchn_refresh_token';

export function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = cookies();
  const isProduction = process.env.NODE_ENV === 'production';

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60, // 15 minutes
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearAuthCookies() {
  const cookieStore = cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

export function getAuthTokensFromCookies() {
  const cookieStore = cookies();
  return {
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE)?.value || null,
    refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE)?.value || null,
  };
}

