import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'uchn_jwt_fallback_secret_for_development_2026';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'uchn_refresh_fallback_secret_for_development_2026';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'CLINIC_ADMIN';
  firstName: string;
  lastName: string;
  clinicId?: string | null;
  patientProfileId?: string | null;
  doctorProfileId?: string | null;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
  });
}

export function generateRefreshToken(payload: { userId: string }): string {
  return jwt.sign(
    { ...payload, jti: `${Date.now()}-${Math.random()}` },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

