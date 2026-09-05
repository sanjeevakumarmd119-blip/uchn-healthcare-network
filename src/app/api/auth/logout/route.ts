import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/server/auth/guards';
import { AuthService } from '@/server/services/auth.service';
import { clearAuthCookies, getAuthTokensFromCookies } from '@/server/auth/cookies';

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    const { refreshToken } = getAuthTokensFromCookies();

    if (session) {
      await AuthService.logout(session.userId, refreshToken || undefined);
    }

    clearAuthCookies();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    clearAuthCookies();
    return NextResponse.json({
      success: true,
      message: 'Logged out',
    });
  }
}

