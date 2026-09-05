import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/server/services/ai.service';
import { requireAuth } from '@/server/auth/guards';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { prescriptionText, clinicId } = body;

    if (!prescriptionText || typeof prescriptionText !== 'string' || prescriptionText.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please provide valid prescription text or medication details.' },
        { status: 400 }
      );
    }

    const result = await AIService.parsePrescription(prescriptionText.trim(), clinicId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('AI Prescription API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse prescription' },
      { status: 500 }
    );
  }
}
