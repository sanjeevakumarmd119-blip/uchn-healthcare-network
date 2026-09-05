import { NextRequest, NextResponse } from 'next/server';
import { RegisterSchema } from '@/server/validators/auth.validator';
import { AuthService } from '@/server/services/auth.service';
import { setAuthCookies } from '@/server/auth/cookies';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = RegisterSchema.parse(body);

    const ipAddress = req.headers.get('x-forwarded-for') || req.ip || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    const result = await AuthService.register(validated, ipAddress, userAgent);

    setAuthCookies(result.accessToken, result.refreshToken);

    return NextResponse.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed. Please verify your details.' },
      { status: 400 }
    );
  }
}

