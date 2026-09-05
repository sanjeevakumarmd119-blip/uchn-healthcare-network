import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, TokenPayload } from './jwt';
import { ACCESS_TOKEN_COOKIE } from './cookies';

export type AllowedRole = 'PATIENT' | 'DOCTOR' | 'CLINIC_ADMIN';

export interface AuthContext {
  user: TokenPayload;
}

export function getSessionFromRequest(req: NextRequest): TokenPayload | null {
  // 1. Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    if (payload) return payload;
  }

  // 2. Check HTTP-only cookie
  const cookieToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (cookieToken) {
    const payload = verifyAccessToken(cookieToken);
    if (payload) return payload;
  }

  return null;
}

export function requireAuth(
  req: NextRequest,
  allowedRoles?: AllowedRole[]
): { user: TokenPayload } | NextResponse {
  const user = getSessionFromRequest(req);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Please sign in.' },
      { status: 401 }
    );
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden. Role '${user.role}' is not authorized to access this resource.`,
        },
        { status: 403 }
      );
    }
  }

  return { user };
}

