import { NextRequest, NextResponse } from 'next/server';
import { ForgotPasswordSchema } from '@/server/validators/auth.validator';
import prisma from '@/server/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = ForgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt,
        },
      });

      console.log(`[PASSWORD_RESET] Token generated for ${email}: ${resetToken}`);
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, password reset instructions have been dispatched.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Invalid request' },
      { status: 400 }
    );
  }
}
